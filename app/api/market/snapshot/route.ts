import { NextResponse } from "next/server";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getPrimaryVersion } from "@/lib/data/cards";
import { getPublicSupabaseClient } from "@/lib/database/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type LatestSnapshotRow = {
  card_version_id: string;
  previous_published_price_php: number | string | null;
  published_price_php: number | string | null;
  calculated_price_php: number | string | null;
  calculated_movement_percent: number | string | null;
  pricing_rule_version: string | null;
  methodology_version: string | null;
  calculated_at: string | null;
  created_at: string | null;
};

type MarketStateRow = {
  id: string;
  card_code: string;
  card_name: string;
  rarity: string;
  version: string;
  initial_reference_price_php: number | string;
  previous_published_price_php: number | string;
  calculated_price_php: number | string;
  published_price_php: number | string;
  active_override_price_php: number | string | null;
  active_override_reason: string | null;
  override_starts_at: string | null;
  override_expires_at: string | null;
  confidence: string;
  last_material_event_at: string | null;
  last_calculated_at: string | null;
  last_published_at: string | null;
  updated_at: string | null;
};

function asNumber(value: number | string | null | undefined, fallback = 0) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? Math.round(numeric) : fallback;
}

async function getLatestSnapshotsByVersionId(versionIds: string[]) {
  const supabase = getPublicSupabaseClient();
  const snapshots = new Map<string, LatestSnapshotRow>();

  if (!supabase || versionIds.length === 0) {
    return snapshots;
  }

  const { data, error } = await supabase
    .from("price_snapshots")
    .select(
      "card_version_id,previous_published_price_php,published_price_php,calculated_price_php,calculated_movement_percent,pricing_rule_version,methodology_version,calculated_at,created_at"
    )
    .in("card_version_id", versionIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("Could not load market snapshot price snapshots:", error.message);
    return snapshots;
  }

  for (const row of (data ?? []) as LatestSnapshotRow[]) {
    if (!snapshots.has(row.card_version_id)) {
      snapshots.set(row.card_version_id, row);
    }
  }

  return snapshots;
}

async function getMarketStates() {
  const supabase = getPublicSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("market_states")
    .select(
      "id,card_code,card_name,rarity,version,initial_reference_price_php,previous_published_price_php,calculated_price_php,published_price_php,active_override_price_php,active_override_reason,override_starts_at,override_expires_at,confidence,last_material_event_at,last_calculated_at,last_published_at,updated_at"
    )
    .order("card_code", { ascending: true });

  if (error || !data || data.length === 0) {
    return null;
  }

  return data as MarketStateRow[];
}

export async function GET() {
  const states = await getMarketStates();

  if (states) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      currency: "PHP",
      source: "market_states",
      cards: states.map((state) => ({
        name: state.card_name,
        cardCode: state.card_code,
        rarity: state.rarity,
        version: state.version,
        initialReferencePrice: asNumber(state.initial_reference_price_php),
        previousPublishedPrice: asNumber(state.previous_published_price_php),
        calculatedPrice: asNumber(state.calculated_price_php),
        publishedPrice: asNumber(state.published_price_php),
        sevenDayMovementPercent: 0,
        confidence: state.confidence,
        activeOverride: state.active_override_price_php
          ? {
              price: asNumber(state.active_override_price_php),
              reason: state.active_override_reason,
              startsAt: state.override_starts_at,
              expiresAt: state.override_expires_at
            }
          : null,
        kpis: {},
        lastMaterialEventAt: state.last_material_event_at,
        lastCalculatedAt: state.last_calculated_at,
        lastPublishedAt: state.last_published_at,
        updatedAt: state.updated_at
      }))
    });
  }

  const cards = await getCardsWithLivePrices();
  const primaryVersions = cards.map((card) => getPrimaryVersion(card));
  const latestSnapshots = await getLatestSnapshotsByVersionId(primaryVersions.map((version) => version.id));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    currency: "PHP",
    cards: cards.map((card) => {
      const version = getPrimaryVersion(card);
      const snapshot = latestSnapshots.get(version.id);
      const publishedPrice = version.currentPublishedPricePhp;
      const previousPublishedPrice = asNumber(
        snapshot?.previous_published_price_php,
        Math.max(0, publishedPrice - version.weeklyChangePhp)
      );

      return {
        name: card.characterName,
        cardCode: card.cardNumber,
        rarity: card.rarity,
        version: version.versionCode,
        initialReferencePrice: version.initialReferencePricePhp,
        previousPublishedPrice,
        calculatedPrice: asNumber(snapshot?.calculated_price_php, publishedPrice),
        publishedPrice,
        sevenDayMovementPercent: version.weeklyChangePercent,
        confidence: version.confidence.toUpperCase(),
        activeOverride: null,
        kpis: {
          demand: version.demandScore,
          scarcity: version.scarcityScore,
          directEvidence: version.directEvidence,
          modeledEvidence: version.modeledEvidence
        },
        lastMaterialEventAt: null,
        lastCalculatedAt: snapshot?.calculated_at ?? snapshot?.created_at ?? version.lastMarketUpdateAt ?? null,
        lastPublishedAt: version.lastMarketUpdateAt ?? snapshot?.created_at ?? null,
        pricingRuleVersion: snapshot?.pricing_rule_version ?? snapshot?.methodology_version ?? null
      };
    })
  });
}
