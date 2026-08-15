import type { Card } from "@/lib/data/cards";
import { applyCollectorPricingToCards, cards } from "@/lib/data/cards";
import { getPublicSupabaseClient } from "@/lib/database/supabase";

type CardVersionPriceRow = {
  id: string;
  version_code: string;
  current_published_price_php: number | string | null;
  current_calculated_price_php: number | string | null;
  last_market_update_at: string | null;
  cards: { card_number: string } | { card_number: string }[] | null;
};

type PriceSnapshotRow = {
  card_version_id: string;
  calculated_movement_percent: number | string | null;
  published_price_php: number | string | null;
  created_at: string | null;
};

type MarketStateCollectorRow = {
  card_code: string;
  version: string;
  collector_price_php: number | string | null;
  collector_price_confidence: string | null;
  verified_sale_low_php: number | string | null;
  verified_sale_median_php: number | string | null;
  verified_sale_high_php: number | string | null;
  verified_sale_count: number | null;
  reseller_ask_low_php: number | string | null;
  reseller_ask_median_php: number | string | null;
  reseller_ask_high_php: number | string | null;
  reseller_ask_count: number | null;
  quick_sale_price_php: number | string | null;
  collector_tier: string | null;
  collector_price_updated_at: string | null;
  collector_pricing_rule_version: string | null;
};

function getCardNumber(row: CardVersionPriceRow): string | undefined {
  if (Array.isArray(row.cards)) {
    return row.cards[0]?.card_number;
  }

  return row.cards?.card_number;
}

function normalizeVersionCode(versionCode: string): string {
  return versionCode === "CN" || versionCode === "TW" ? "HK" : versionCode;
}

function copyStaticCards(): Card[] {
  return cards.map((card) => ({
    ...card,
    versions: card.versions.map((version) => ({ ...version })),
    priceHistory: card.priceHistory.map((point) => ({ ...point }))
  }));
}

function calculateChangePhpFromMovement(pricePhp: number, movementPercent: number): number {
  const divisor = 1 + movementPercent / 100;

  if (!Number.isFinite(divisor) || divisor <= 0) {
    return 0;
  }

  return Math.round(pricePhp - pricePhp / divisor);
}

function numberOrNull(value: number | string | null | undefined) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? Math.round(numeric) : null;
}

export async function getCardsWithLivePrices(): Promise<Card[]> {
  const supabase = getPublicSupabaseClient();
  const liveCards = applyCollectorPricingToCards(copyStaticCards());

  if (!supabase) {
    return liveCards;
  }

  const { data, error } = await supabase
    .from("card_versions")
    .select(
      "id,version_code,current_published_price_php,current_calculated_price_php,last_market_update_at,cards(card_number)"
    )
    .in("pricing_state", ["LIVE", "FROZEN"]);

  if (error || !data) {
    console.warn("Falling back to static card prices:", error?.message);
    return liveCards;
  }

  const rows = data as CardVersionPriceRow[];
  const versionIds = rows.map((row) => row.id).filter(Boolean);
  const latestSnapshotsByVersionId = new Map<string, PriceSnapshotRow>();
  const collectorStateByCardAndVersion = new Map<string, MarketStateCollectorRow>();

  const { data: marketStates, error: marketStateError } = await supabase
    .from("market_states")
    .select(
      "card_code,version,collector_price_php,collector_price_confidence,verified_sale_low_php,verified_sale_median_php,verified_sale_high_php,verified_sale_count,reseller_ask_low_php,reseller_ask_median_php,reseller_ask_high_php,reseller_ask_count,quick_sale_price_php,collector_tier,collector_price_updated_at,collector_pricing_rule_version"
    );

  if (!marketStateError) {
    for (const state of (marketStates ?? []) as MarketStateCollectorRow[]) {
      collectorStateByCardAndVersion.set(`${state.card_code}:${normalizeVersionCode(state.version)}`, state);
    }
  }

  if (versionIds.length > 0) {
    const { data: snapshots, error: snapshotError } = await supabase
      .from("price_snapshots")
      .select("card_version_id,calculated_movement_percent,published_price_php,created_at")
      .in("card_version_id", versionIds)
      .order("created_at", { ascending: false });

    if (snapshotError) {
      console.warn("Could not load latest price movement snapshots:", snapshotError.message);
    }

    for (const snapshot of (snapshots ?? []) as PriceSnapshotRow[]) {
      if (!latestSnapshotsByVersionId.has(snapshot.card_version_id)) {
        latestSnapshotsByVersionId.set(snapshot.card_version_id, snapshot);
      }
    }
  }

  for (const row of rows) {
    const cardNumber = getCardNumber(row);
    const card = liveCards.find((item) => item.cardNumber === cardNumber);
    const versionCode = normalizeVersionCode(row.version_code);
    const version = card?.versions.find((item) => item.versionCode === versionCode);
    const publishedPrice = Number(row.current_published_price_php);

    if (!card || !version || !Number.isFinite(publishedPrice)) {
      continue;
    }

    version.currentPublishedPricePhp = Math.round(publishedPrice);
    version.lastMarketUpdateAt = row.last_market_update_at;

    const latestSnapshot = latestSnapshotsByVersionId.get(row.id);
    const movementPercent = Number(latestSnapshot?.calculated_movement_percent);

    if (Number.isFinite(movementPercent)) {
      version.weeklyChangePercent = movementPercent;
      version.weeklyChangePhp = calculateChangePhpFromMovement(
        version.currentPublishedPricePhp,
        movementPercent
      );
    } else {
      const previousPrice = version.currentPublishedPricePhp;
      version.weeklyChangePhp = version.currentPublishedPricePhp - previousPrice;
      version.weeklyChangePercent = 0;
    }

    const collectorState = collectorStateByCardAndVersion.get(`${card.cardNumber}:${version.versionCode}`);

    if (collectorState) {
      version.collectorPricePhp = numberOrNull(collectorState.collector_price_php);
      version.collectorPriceConfidence =
        collectorState.collector_price_confidence === "HIGH" ||
        collectorState.collector_price_confidence === "MEDIUM" ||
        collectorState.collector_price_confidence === "LOW"
          ? collectorState.collector_price_confidence
          : "INSUFFICIENT_DATA";
      version.verifiedSaleLowPhp = numberOrNull(collectorState.verified_sale_low_php);
      version.verifiedSaleMedianPhp = numberOrNull(collectorState.verified_sale_median_php);
      version.verifiedSaleHighPhp = numberOrNull(collectorState.verified_sale_high_php);
      version.verifiedSaleCount = collectorState.verified_sale_count ?? 0;
      version.resellerAskLowPhp = numberOrNull(collectorState.reseller_ask_low_php);
      version.resellerAskMedianPhp = numberOrNull(collectorState.reseller_ask_median_php);
      version.resellerAskHighPhp = numberOrNull(collectorState.reseller_ask_high_php);
      version.resellerAskCount = collectorState.reseller_ask_count ?? 0;
      version.quickSalePricePhp = numberOrNull(collectorState.quick_sale_price_php);
      version.collectorTier =
        collectorState.collector_tier === "S" ||
        collectorState.collector_tier === "A" ||
        collectorState.collector_tier === "B" ||
        collectorState.collector_tier === "C"
          ? collectorState.collector_tier
          : null;
      version.collectorPriceUpdatedAt = collectorState.collector_price_updated_at;
      version.collectorPricingRuleVersion =
        collectorState.collector_pricing_rule_version ?? version.collectorPricingRuleVersion;
    }

    if (version.versionCode === "JP") {
      const latestPoint = card.priceHistory[card.priceHistory.length - 1];

      if (latestPoint) {
        latestPoint.pricePhp = version.currentPublishedPricePhp;
      }
    }
  }

  return liveCards;
}

export async function getCardWithLivePrices(cardNumber: string): Promise<Card | undefined> {
  const liveCards = await getCardsWithLivePrices();

  return liveCards.find(
    (card) => card.cardNumber.toLowerCase() === cardNumber.toLowerCase()
  );
}
