import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getServiceSupabaseClient } from "@/lib/database/supabase";
import {
  marketEventInputSchema,
  normalizeMarketEvent,
  type NormalizedMarketEvent
} from "@/lib/domain/market-events";
import { requireAdminMarketSecret } from "@/lib/http/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type CardRow = {
  id: string;
  card_number: string;
  character_name: string;
};

type CardVersionRow = {
  id: string;
  card_id: string;
  version_code: string;
  current_published_price_php: number | string | null;
};

async function getCardAndVersion(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  cardCode: string,
  version: string
) {
  const { data: card, error: cardError } = await supabase
    .from("cards")
    .select("id,card_number,character_name")
    .eq("card_number", cardCode)
    .maybeSingle();

  if (cardError || !card) {
    return { card: null, version: null, error: cardError?.message ?? "Card not found." };
  }

  const { data: cardVersion, error: versionError } = await supabase
    .from("card_versions")
    .select("id,card_id,version_code,current_published_price_php")
    .eq("card_id", (card as CardRow).id)
    .eq("version_code", version)
    .maybeSingle();

  if (versionError) {
    return { card: card as CardRow, version: null, error: versionError.message };
  }

  return { card: card as CardRow, version: (cardVersion as CardVersionRow | null) ?? null, error: null };
}

function buildInsertPayload(
  event: NormalizedMarketEvent,
  card: CardRow | null,
  version: CardVersionRow | null,
  idempotencyKey: string | null
) {
  return {
    card_id: card?.id ?? null,
    card_version_id: version?.id ?? null,
    card_code: event.cardCode,
    version: event.version,
    marketplace: event.marketplace,
    source_url: event.sourceUrl,
    marketplace_listing_id: event.marketplaceListingId ?? null,
    marketplace_transaction_id: event.marketplaceTransactionId ?? null,
    seller_id: event.sellerId ?? null,
    seller_name: event.sellerName ?? null,
    event_type: event.eventType,
    event_at: event.eventAt,
    discovered_at: event.discoveredAt,
    currency: event.currency,
    native_amount: event.nativeAmount ?? null,
    php_amount: event.phpAmount ?? null,
    fx_rate: event.fxRate ?? null,
    fx_rate_timestamp: event.fxRateTimestamp ?? null,
    listing_price: event.listingPrice ?? null,
    sale_price: event.salePrice ?? null,
    condition: event.condition,
    condition_confidence: event.conditionConfidence ?? null,
    bid_count: event.bidCount ?? null,
    watcher_count: event.watcherCount ?? null,
    cart_count: event.cartCount ?? null,
    offer_count: event.offerCount ?? null,
    watcher_delta: event.watcherDelta ?? null,
    cart_delta: event.cartDelta ?? null,
    bid_delta: event.bidDelta ?? null,
    validation_status: event.validationStatus,
    seller_confidence: event.sellerConfidence ?? null,
    version_confidence: event.versionConfidence ?? null,
    comparability_confidence: event.comparabilityConfidence ?? null,
    evidence_confidence: event.evidenceConfidence ?? null,
    duplicate_of: event.duplicateOf ?? null,
    duplicate_fingerprint: event.duplicateFingerprint,
    idempotency_key: idempotencyKey,
    notes: event.notes ?? null
  };
}

async function findDuplicate(
  supabase: NonNullable<ReturnType<typeof getServiceSupabaseClient>>,
  duplicateFingerprint: string,
  idempotencyKey: string | null
) {
  if (idempotencyKey) {
    const { data } = await supabase
      .from("market_events")
      .select("id,validation_status")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (data) return data as { id: string; validation_status: string };
  }

  const { data } = await supabase
    .from("market_events")
    .select("id,validation_status")
    .eq("duplicate_fingerprint", duplicateFingerprint)
    .maybeSingle();

  return (data as { id: string; validation_status: string } | null) ?? null;
}

export async function POST(request: Request) {
  const unauthorized = requireAdminMarketSecret(request);

  if (unauthorized) return unauthorized;

  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase service credentials are not configured." }, { status: 500 });
  }

  try {
    const idempotencyKey = request.headers.get("idempotency-key");
    const body = await request.json();
    const parsed = marketEventInputSchema.parse(body);
    const { card, version, error } = await getCardAndVersion(
      supabase,
      parsed.cardCode,
      parsed.version.toUpperCase()
    );
    const normalized = normalizeMarketEvent(
      {
        ...parsed,
        version: parsed.version.toUpperCase(),
        validationStatus: version ? parsed.validationStatus : "REVIEW_REQUIRED",
        notes: version
          ? parsed.notes
          : [parsed.notes, error ?? "Version could not be linked to a LIVE card_version."]
              .filter(Boolean)
              .join(" ")
      },
      Number(version?.current_published_price_php)
    );
    const duplicate = await findDuplicate(supabase, normalized.duplicateFingerprint, idempotencyKey);

    if (duplicate) {
      return NextResponse.json({
        status: "duplicate",
        eventId: duplicate.id,
        duplicateOf: duplicate.id,
        validationStatus: duplicate.validation_status
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("market_events")
      .insert(buildInsertPayload(normalized, card, version, idempotencyKey))
      .select("id,validation_status")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.from("audit_logs").insert({
      action: "MARKET_EVENT_INGESTED",
      entity_type: "market_events",
      entity_id: inserted.id,
      previous_value: null,
      new_value: {
        cardCode: normalized.cardCode,
        version: normalized.version,
        eventType: normalized.eventType,
        validationStatus: normalized.validationStatus,
        isMaterialForPricing: normalized.isMaterialForPricing
      },
      reason: "Admin market event ingestion API",
      actor_id: null
    });

    return NextResponse.json({
      status: normalized.validationStatus.toLowerCase(),
      eventId: inserted.id,
      duplicateOf: null,
      materialForPricing: normalized.isMaterialForPricing
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Invalid market event payload.", issues: error.issues }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown ingestion error." },
      { status: 500 }
    );
  }
}
