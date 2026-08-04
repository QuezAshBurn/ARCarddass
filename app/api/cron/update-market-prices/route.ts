import { NextResponse } from "next/server";
import { cards as staticCards } from "@/lib/data/cards";
import { getServiceSupabaseClient } from "@/lib/database/supabase";
import { calculateMarketUpdateForVersion } from "@/lib/domain/market-updates";
import { requireCronSecret } from "@/lib/http/cron";
import { methodologyVersion } from "@/config/pricing-rules";

type DbVersionRow = {
  id: string;
  version_code: string;
  pricing_state: string;
  current_published_price_php: number | string | null;
  cards:
    | { card_number: string; character_name: string }
    | { card_number: string; character_name: string }[]
    | null;
};

function getIsoTimestamp(date: Date): string {
  return date.toISOString();
}

function getRunKey(now: Date): string {
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");

  return `MARKET_PRICE_UPDATE:${yyyy}-${mm}-${dd}T${hh}:00Z`;
}

function getCardNumber(row: DbVersionRow): string | undefined {
  if (Array.isArray(row.cards)) {
    return row.cards[0]?.card_number;
  }

  return row.cards?.card_number;
}

function getCharacterName(row: DbVersionRow): string | undefined {
  if (Array.isArray(row.cards)) {
    return row.cards[0]?.character_name;
  }

  return row.cards?.character_name;
}

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);

  if (unauthorized) {
    return unauthorized;
  }

  const now = new Date();
  const runKey = getRunKey(now);
  const pricingPeriodEnd = getIsoTimestamp(now);
  const pricingPeriodStart = getIsoTimestamp(new Date(Number(now) - 12 * 60 * 60 * 1000));
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    const updates = staticCards.flatMap((card) =>
      card.versions
        .filter((version) => version.pricingState === "LIVE")
        .map((version) => calculateMarketUpdateForVersion(card, version))
    );

    return NextResponse.json({
      jobType: "MARKET_PRICE_UPDATE",
      status: "CALCULATED_STATIC_PREVIEW",
      schedule: "0 4,16 * * * UTC = 12:00 and 00:00 Asia/Manila daily",
      runKey,
      processedVersionCount: updates.length,
      note:
        "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel to persist and publish these prices automatically.",
      updates
    });
  }

  const { data: previousRun, error: previousRunError } = await supabase
    .from("job_runs")
    .select("id,status,completed_at")
    .eq("job_type", "MARKET_PRICE_UPDATE")
    .eq("run_key", runKey)
    .maybeSingle();

  if (previousRunError) {
    return NextResponse.json({ error: previousRunError.message }, { status: 500 });
  }

  if (previousRun?.status === "COMPLETED") {
    return NextResponse.json({
      jobType: "MARKET_PRICE_UPDATE",
      status: "ALREADY_COMPLETED",
      runKey,
      completedAt: previousRun.completed_at
    });
  }

  await supabase.from("job_runs").upsert(
    {
      job_type: "MARKET_PRICE_UPDATE",
      run_key: runKey,
      status: "RUNNING",
      started_at: now.toISOString(),
      retry_count: previousRun ? 1 : 0
    },
    { onConflict: "job_type,run_key" }
  );

  const { data: dbVersions, error: versionError } = await supabase
    .from("card_versions")
    .select("id,version_code,pricing_state,current_published_price_php,cards(card_number,character_name)")
    .eq("pricing_state", "LIVE");

  if (versionError || !dbVersions) {
    await supabase
      .from("job_runs")
      .update({ status: "FAILED", error_message: versionError?.message ?? "No LIVE versions found" })
      .eq("job_type", "MARKET_PRICE_UPDATE")
      .eq("run_key", runKey);

    return NextResponse.json(
      { error: versionError?.message ?? "No LIVE versions found" },
      { status: 500 }
    );
  }

  const updates = [];

  for (const dbVersion of dbVersions as DbVersionRow[]) {
    const cardNumber = getCardNumber(dbVersion);
    const staticCard = staticCards.find((card) => card.cardNumber === cardNumber);
    const staticVersion = staticCard?.versions.find(
      (version) => version.versionCode === dbVersion.version_code
    );

    if (!staticCard || !staticVersion) {
      continue;
    }

    const currentPublishedPricePhp = Number(dbVersion.current_published_price_php);
    const versionForCalculation = {
      ...staticVersion,
      currentPublishedPricePhp: Number.isFinite(currentPublishedPricePhp)
        ? Math.round(currentPublishedPricePhp)
        : staticVersion.currentPublishedPricePhp
    };
    const update = calculateMarketUpdateForVersion(staticCard, versionForCalculation);

    const { data: snapshot, error: snapshotError } = await supabase
      .from("price_snapshots")
      .upsert(
        {
          card_version_id: dbVersion.id,
          pricing_period_start: pricingPeriodStart,
          pricing_period_end: pricingPeriodEnd,
          transaction_score: update.input.transactionScore,
          buyer_intent_score: update.input.buyerIntentScore,
          search_demand_score: update.input.searchDemandScore,
          scarcity_score: update.input.scarcityScore,
          price_momentum_score: update.input.priceMomentumScore,
          market_breadth_score: update.input.marketBreadthScore,
          market_score: update.result.marketScore,
          movement_cap_percent: update.result.movementCapPercent,
          calculated_movement_percent: update.result.calculatedMovementPercent,
          calculated_price_php: update.result.calculatedPricePhp,
          published_price_php: update.nextPublishedPricePhp,
          confidence: staticVersion.confidence,
          methodology_version: methodologyVersion
        },
        { onConflict: "card_version_id,pricing_period_start,pricing_period_end" }
      )
      .select("id")
      .single();

    if (snapshotError) {
      await supabase
        .from("job_runs")
        .update({ status: "FAILED", error_message: snapshotError.message })
        .eq("job_type", "MARKET_PRICE_UPDATE")
        .eq("run_key", runKey);

      return NextResponse.json({ error: snapshotError.message }, { status: 500 });
    }

    const { error: publishError } = await supabase
      .from("card_versions")
      .update({
        current_calculated_price_php: update.result.calculatedPricePhp,
        current_published_price_php: update.nextPublishedPricePhp,
        last_market_update_at: now.toISOString()
      })
      .eq("id", dbVersion.id);

    if (publishError) {
      await supabase
        .from("job_runs")
        .update({ status: "FAILED", error_message: publishError.message })
        .eq("job_type", "MARKET_PRICE_UPDATE")
        .eq("run_key", runKey);

      return NextResponse.json({ error: publishError.message }, { status: 500 });
    }

    updates.push({
      ...update,
      characterName: getCharacterName(dbVersion) ?? update.characterName,
      databaseCardVersionId: dbVersion.id,
      snapshotId: snapshot.id
    });
  }

  await supabase
    .from("job_runs")
    .update({
      status: "COMPLETED",
      completed_at: new Date().toISOString(),
      processed_count: updates.length,
      rejected_count: Math.max(0, dbVersions.length - updates.length)
    })
    .eq("job_type", "MARKET_PRICE_UPDATE")
    .eq("run_key", runKey);

  return NextResponse.json({
    jobType: "MARKET_PRICE_UPDATE",
    status: "COMPLETED",
    schedule: "0 4,16 * * * UTC = 12:00 and 00:00 Asia/Manila daily",
    runKey,
    pricingPeriodStart,
    pricingPeriodEnd,
    processedVersionCount: updates.length,
    updates
  });
}