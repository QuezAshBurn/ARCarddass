import { NextResponse } from "next/server";
import { applyCollectorPricingToCards, cards as staticCards } from "@/lib/data/cards";
import { getServiceSupabaseClient } from "@/lib/database/supabase";
import { calculateMarketUpdateForVersion } from "@/lib/domain/market-updates";
import { requireCronSecret } from "@/lib/http/cron";
import { methodologyVersion } from "@/config/pricing-rules";

const manilaUtcOffsetMs = 8 * 60 * 60 * 1000;
const halfDayMs = 12 * 60 * 60 * 1000;
const staticCardsWithCollectorPricing = applyCollectorPricingToCards(staticCards);

type MarketPriceUpdateOptions = {
  now?: Date;
};

function getCurrentPricingSlotStart(now: Date): Date {
  const manilaDate = new Date(now.getTime() + manilaUtcOffsetMs);
  const localYear = manilaDate.getUTCFullYear();
  const localMonth = manilaDate.getUTCMonth();
  const localDay = manilaDate.getUTCDate();
  const localHour = manilaDate.getUTCHours();
  const localSlotHour = localHour >= 12 ? 12 : 0;

  return new Date(Date.UTC(localYear, localMonth, localDay, localSlotHour) - manilaUtcOffsetMs);
}

function getPreviousPricingSlotStart(slotStart: Date): Date {
  return new Date(slotStart.getTime() - halfDayMs);
}
type FreshEvidenceRow = {
  card_version_id: string;
};

type MaterialMarketEventRow = {
  id: string;
  card_version_id: string;
  event_type: string;
  event_at: string;
  validation_status: string;
  seller_id: string | null;
  marketplace_transaction_id: string | null;
  marketplace_listing_id: string | null;
};

type DbVersionRow = {
  id: string;
  card_id: string;
  version_code: string;
  pricing_state: string;
  initial_reference_price_php: number | string | null;
  current_published_price_php: number | string | null;
  cards:
    | { card_number: string; character_name: string }
    | { card_number: string; character_name: string }[]
    | null;
};

function normalizeVersionCode(versionCode: string): string {
  return versionCode === "CN" || versionCode === "TW" ? "HK" : versionCode;
}

function getIsoTimestamp(date: Date): string {
  return date.toISOString();
}

function getRunKey(slotStart: Date): string {
  const yyyy = slotStart.getUTCFullYear();
  const mm = String(slotStart.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(slotStart.getUTCDate()).padStart(2, "0");
  const hh = String(slotStart.getUTCHours()).padStart(2, "0");

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

export async function runMarketPriceUpdate(options: MarketPriceUpdateOptions = {}) {
  const now = options.now ?? new Date();
  const slotStart = getCurrentPricingSlotStart(now);
  const previousSlotStart = getPreviousPricingSlotStart(slotStart);
  const runKey = getRunKey(slotStart);
  const pricingPeriodEnd = getIsoTimestamp(slotStart);
  const pricingPeriodStart = getIsoTimestamp(previousSlotStart);
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    const updates = staticCardsWithCollectorPricing.flatMap((card) =>
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
    .select("id,card_id,version_code,pricing_state,initial_reference_price_php,current_published_price_php,cards(card_number,character_name)")
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

  const versionRows = dbVersions as DbVersionRow[];
  const versionIds = versionRows.map((version) => version.id);
  const freshEvidenceVersionIds = new Set<string>();
  const materialEventIdsByVersionId = new Map<string, string[]>();
  const verifiedSaleKeysByVersionId = new Map<string, Set<string>>();

  if (versionIds.length > 0) {
    const { data: materialEvents, error: marketEventError } = await supabase
      .from("market_events")
      .select(
        "id,card_version_id,event_type,event_at,validation_status,seller_id,marketplace_transaction_id,marketplace_listing_id"
      )
      .in("card_version_id", versionIds)
      .eq("validation_status", "ACCEPTED")
      .gte("event_at", pricingPeriodStart)
      .lt("event_at", pricingPeriodEnd)
      .is("processed_at", null);

    if (!marketEventError) {
      for (const event of (materialEvents ?? []) as MaterialMarketEventRow[]) {
        freshEvidenceVersionIds.add(event.card_version_id);

        const existingIds = materialEventIdsByVersionId.get(event.card_version_id) ?? [];
        existingIds.push(event.id);
        materialEventIdsByVersionId.set(event.card_version_id, existingIds);

        if (event.event_type === "VERIFIED_SALE") {
          const sellerKey = event.seller_id ?? "unknown-seller";
          const transactionKey =
            event.marketplace_transaction_id ??
            event.marketplace_listing_id ??
            event.id;
          const saleKey = `${sellerKey}:${transactionKey}`;
          const keys = verifiedSaleKeysByVersionId.get(event.card_version_id) ?? new Set<string>();
          keys.add(saleKey);
          verifiedSaleKeysByVersionId.set(event.card_version_id, keys);
        }
      }
    } else {
      console.warn(
        "market_events table is unavailable; falling back to legacy market_evidence.",
        marketEventError.message
      );
    }

    const { data: freshEvidence, error: freshEvidenceError } = await supabase
      .from("market_evidence")
      .select("card_version_id")
      .in("card_version_id", versionIds)
      .in("evidence_status", ["accepted", "stored"])
      .gte("created_at", pricingPeriodStart)
      .lt("created_at", pricingPeriodEnd);

    if (freshEvidenceError) {
      await supabase
        .from("job_runs")
        .update({ status: "FAILED", error_message: freshEvidenceError.message })
        .eq("job_type", "MARKET_PRICE_UPDATE")
        .eq("run_key", runKey);

      return NextResponse.json({ error: freshEvidenceError.message }, { status: 500 });
    }

    for (const evidence of (freshEvidence ?? []) as FreshEvidenceRow[]) {
      freshEvidenceVersionIds.add(evidence.card_version_id);
    }
  }

  const updates = [];

  for (const dbVersion of versionRows) {
    const cardNumber = getCardNumber(dbVersion);
    const staticCard = staticCardsWithCollectorPricing.find((card) => card.cardNumber === cardNumber);
    const staticVersion = staticCard?.versions.find(
      (version) => version.versionCode === normalizeVersionCode(dbVersion.version_code)
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
    const update = calculateMarketUpdateForVersion(staticCard, versionForCalculation, {
      hasFreshMaterialEvidence: freshEvidenceVersionIds.has(dbVersion.id),
      verifiedSaleCount: verifiedSaleKeysByVersionId.get(dbVersion.id)?.size
    });
    const evidenceIds = materialEventIdsByVersionId.get(dbVersion.id) ?? [];

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
          previous_published_price_php: update.basePublishedPricePhp,
          kpi_scores: {
            transaction: update.input.transactionScore,
            buyerIntent: update.input.buyerIntentScore,
            searchDemand: update.input.searchDemandScore,
            scarcity: update.input.scarcityScore,
            priceMomentum: update.input.priceMomentumScore,
            marketBreadth: update.input.marketBreadthScore
          },
          evidence_ids: evidenceIds,
          raw_movement_percent: update.result.calculatedMovementPercent,
          capped_movement_percent: update.result.calculatedMovementPercent,
          calculated_price_php: update.result.calculatedPricePhp,
          collector_price_php: staticVersion.collectorPricePhp,
          collector_price_confidence: staticVersion.collectorPriceConfidence,
          verified_sale_low_php: staticVersion.verifiedSaleLowPhp,
          verified_sale_median_php: staticVersion.verifiedSaleMedianPhp,
          verified_sale_high_php: staticVersion.verifiedSaleHighPhp,
          verified_sale_count: staticVersion.verifiedSaleCount,
          reseller_ask_low_php: staticVersion.resellerAskLowPhp,
          reseller_ask_median_php: staticVersion.resellerAskMedianPhp,
          reseller_ask_high_php: staticVersion.resellerAskHighPhp,
          reseller_ask_count: staticVersion.resellerAskCount,
          quick_sale_price_php: staticVersion.quickSalePricePhp,
          collector_tier: staticVersion.collectorTier,
          collector_price_updated_at: staticVersion.collectorPriceUpdatedAt,
          collector_pricing_rule_version: staticVersion.collectorPricingRuleVersion,
          published_price_php: update.nextPublishedPricePhp,
          confidence: staticVersion.confidence,
          methodology_version: methodologyVersion,
          pricing_rule_version: methodologyVersion,
          calculated_at: now.toISOString()
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

    const marketStatePayload = {
      card_id: dbVersion.card_id,
      card_code: cardNumber ?? update.cardNumber,
      card_name: getCharacterName(dbVersion) ?? update.characterName,
      rarity: update.rarity,
      version: dbVersion.version_code,
      initial_reference_price_php:
        Number(dbVersion.initial_reference_price_php) || staticVersion.initialReferencePricePhp,
      previous_published_price_php: update.basePublishedPricePhp,
      calculated_price_php: update.result.calculatedPricePhp,
      published_price_php: update.nextPublishedPricePhp,
      collector_price_php: staticVersion.collectorPricePhp,
      collector_price_confidence: staticVersion.collectorPriceConfidence,
      verified_sale_low_php: staticVersion.verifiedSaleLowPhp,
      verified_sale_median_php: staticVersion.verifiedSaleMedianPhp,
      verified_sale_high_php: staticVersion.verifiedSaleHighPhp,
      verified_sale_count: staticVersion.verifiedSaleCount,
      reseller_ask_low_php: staticVersion.resellerAskLowPhp,
      reseller_ask_median_php: staticVersion.resellerAskMedianPhp,
      reseller_ask_high_php: staticVersion.resellerAskHighPhp,
      reseller_ask_count: staticVersion.resellerAskCount,
      quick_sale_price_php: staticVersion.quickSalePricePhp,
      collector_tier: staticVersion.collectorTier,
      collector_price_updated_at: staticVersion.collectorPriceUpdatedAt,
      collector_pricing_rule_version: staticVersion.collectorPricingRuleVersion,
      confidence: staticVersion.confidence.toUpperCase(),
      last_evidence_check_at: now.toISOString(),
      last_calculated_at: now.toISOString(),
      last_published_at: now.toISOString(),
      source_card_version_id: dbVersion.id,
      ...(evidenceIds.length > 0 ? { last_material_event_at: now.toISOString() } : {})
    };

    await supabase.from("market_states").upsert(
      marketStatePayload,
      { onConflict: "card_id,version" }
    );

    if (evidenceIds.length > 0) {
      await supabase
        .from("market_events")
        .update({ processed_at: now.toISOString() })
        .in("id", evidenceIds);
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
export async function runMarketPriceUpdateCron(request: Request) {
  const unauthorized = requireCronSecret(request);

  if (unauthorized) {
    return unauthorized;
  }

  return runMarketPriceUpdate();
}

export async function ensureMarketPricesFresh() {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return { status: "SKIPPED_NO_SUPABASE" as const };
  }

  const now = new Date();
  const slotStart = getCurrentPricingSlotStart(now);
  const runKey = getRunKey(slotStart);

  const { data, error } = await supabase
    .from("card_versions")
    .select("last_market_update_at")
    .eq("pricing_state", "LIVE")
    .order("last_market_update_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn("Could not check market freshness:", error.message);
    return { status: "SKIPPED_FRESHNESS_CHECK_FAILED" as const, error: error.message };
  }

  const latestUpdateAt = data?.last_market_update_at
    ? new Date(data.last_market_update_at)
    : null;

  if (latestUpdateAt && latestUpdateAt.getTime() >= slotStart.getTime()) {
    return {
      status: "FRESH" as const,
      runKey,
      latestUpdateAt: latestUpdateAt.toISOString(),
      slotStart: slotStart.toISOString()
    };
  }

  console.warn("Market prices are stale for the current slot; running catch-up update.", {
    runKey,
    latestUpdateAt: latestUpdateAt?.toISOString() ?? null,
    slotStart: slotStart.toISOString()
  });

  return runMarketPriceUpdate({ now });
}
