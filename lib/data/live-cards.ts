import type { Card, CardVersion, PricingState } from "@/lib/data/cards";
import { applyCollectorPricingToCards, cards } from "@/lib/data/cards";
import { getPublicSupabaseClient } from "@/lib/database/supabase";

type CardMetadata = {
  card_number: string;
  character_name: string;
  category: string | null;
  pricing_enabled: boolean | null;
  catalogue_status: string | null;
  front_image_path: string | null;
  product_line: string | null;
  printed_number: string | null;
  summary: string | null;
  accent_a: string | null;
  accent_b: string | null;
  research_pricing_source: string | null;
  research_pricing_url: string | null;
  research_pricing_confidence: string | null;
  sets: { name: string } | { name: string }[] | null;
  rarities: { code: string } | { code: string }[] | null;
};

type CardVersionPriceRow = {
  id: string;
  version_code: string;
  language: string;
  region: string;
  verification_status: string;
  pricing_state: string;
  initial_reference_price_php: number | string | null;
  high_water_reference_php: number | string | null;
  highest_verified_sale_php: number | string | null;
  current_published_price_php: number | string | null;
  current_calculated_price_php: number | string | null;
  last_market_update_at: string | null;
  cards: CardMetadata | CardMetadata[] | null;
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
  demand_score: number | null;
  scarcity_score: number | null;
  direct_evidence_count: number | null;
  modeled_evidence_count: number | null;
};

function getCardNumber(row: CardVersionPriceRow): string | undefined {
  if (Array.isArray(row.cards)) {
    return row.cards[0]?.card_number;
  }

  return row.cards?.card_number;
}

function getCardMetadata(row: CardVersionPriceRow): CardMetadata | undefined {
  if (Array.isArray(row.cards)) {
    return row.cards[0];
  }

  return row.cards ?? undefined;
}

function getRelationValue<T extends Record<string, unknown>>(
  value: T | T[] | null,
  key: keyof T
): T[keyof T] | undefined {
  return Array.isArray(value) ? value[0]?.[key] : value?.[key];
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

function getAccentColors(rarity: string) {
  if (rarity === "R") return { accentA: "#ec4899", accentB: "#7c3aed" };
  if (rarity === "UC") return { accentA: "#0ea5e9", accentB: "#1d4ed8" };

  return { accentA: "#a16207", accentB: "#1f2937" };
}

function toVersionCode(versionCode: string): CardVersion["versionCode"] {
  const normalized = normalizeVersionCode(versionCode);

  return normalized === "EN" || normalized === "HK" ? normalized : "JP";
}

function toPricingState(state: string): PricingState {
  if (
    state === "UNINITIALIZED" ||
    state === "INITIALIZED" ||
    state === "LIVE" ||
    state === "FROZEN" ||
    state === "REBASE_PENDING"
  ) {
    return state;
  }

  return "LIVE";
}

function createWantedCardFromDatabase(row: CardVersionPriceRow): Card | undefined {
  const metadata = getCardMetadata(row);

  if (!metadata || metadata.product_line !== "Wanted") {
    return undefined;
  }

  const rarity = getRelationValue(metadata.rarities, "code");
  const setName = getRelationValue(metadata.sets, "name");

  if (rarity !== "R" && rarity !== "UC" && rarity !== "C") {
    return undefined;
  }

  const price = numberOrNull(row.current_published_price_php) ?? 0;
  const initialReference = numberOrNull(row.initial_reference_price_php) ?? price;
  const { accentA, accentB } = getAccentColors(rarity);

  return {
    productLine: "Wanted",
    cardNumber: metadata.card_number,
    printedNumber: metadata.printed_number ?? undefined,
    characterName: metadata.character_name,
    formationSet: typeof setName === "string" ? setName : "Wanted",
    rarity,
    category: metadata.category ?? "Wanted card",
    pricingTier: 1,
    pricingEnabled: metadata.pricing_enabled ?? true,
    catalogueStatus: metadata.catalogue_status === "seeded" ? "seeded" : "live",
    accentA: metadata.accent_a ?? accentA,
    accentB: metadata.accent_b ?? accentB,
    summary:
      metadata.summary ??
      "Database-backed Wanted card. Live pricing and marketplace evidence are maintained in Supabase.",
    frontImagePath: metadata.front_image_path ?? "",
    researchHighPricePhp: price,
    researchPricingSource: metadata.research_pricing_source ?? undefined,
    researchPricingUrl: metadata.research_pricing_url ?? undefined,
    researchPricingConfidence:
      metadata.research_pricing_confidence === "Observed listing" ||
      metadata.research_pricing_confidence === "Observed auction high" ||
      metadata.research_pricing_confidence === "Modeled estimate" ||
      metadata.research_pricing_confidence === "Needs review"
        ? metadata.research_pricing_confidence
        : undefined,
    versions: [
      {
        id: row.id,
        versionCode: toVersionCode(row.version_code),
        language: row.language,
        region: row.region,
        verificationStatus:
          row.verification_status === "confirmed" || row.verification_status === "modeled"
            ? row.verification_status
            : "needs-review",
        pricingState: toPricingState(row.pricing_state),
        versionRelationship: "Database-backed market reference",
        currentPublishedPricePhp: price,
        initialReferencePricePhp: initialReference,
        highWaterReferencePhp: numberOrNull(row.high_water_reference_php) ?? price,
        highestVerifiedSalePhp: numberOrNull(row.highest_verified_sale_php) ?? 0,
        weeklyChangePhp: 0,
        weeklyChangePercent: 0,
        lastMarketUpdateAt: row.last_market_update_at,
        collectorPricePhp: null,
        collectorPriceConfidence: "INSUFFICIENT_DATA",
        verifiedSaleLowPhp: null,
        verifiedSaleMedianPhp: null,
        verifiedSaleHighPhp: null,
        verifiedSaleCount: 0,
        resellerAskLowPhp: null,
        resellerAskMedianPhp: null,
        resellerAskHighPhp: null,
        resellerAskCount: 0,
        quickSalePricePhp: null,
        collectorTier: null,
        collectorPriceUpdatedAt: null,
        collectorPricingRuleVersion: "database-1.0.0",
        demandScore: 0,
        scarcityScore: 0,
        confidence: "Low",
        directEvidence: 0,
        modeledEvidence: 0
      }
    ],
    priceHistory: [{ week: "Current", pricePhp: price }]
  };
}

export async function getCardsWithLivePrices(): Promise<Card[]> {
  const supabase = getPublicSupabaseClient();
  const liveCards = applyCollectorPricingToCards(
    copyStaticCards().filter((card) => card.productLine !== "Wanted")
  );

  if (!supabase) {
    return liveCards;
  }

  const { data, error } = await supabase
    .from("card_versions")
    .select(
      "id,version_code,language,region,verification_status,pricing_state,initial_reference_price_php,high_water_reference_php,highest_verified_sale_php,current_published_price_php,current_calculated_price_php,last_market_update_at,cards(card_number,character_name,category,pricing_enabled,catalogue_status,front_image_path,product_line,printed_number,summary,accent_a,accent_b,research_pricing_source,research_pricing_url,research_pricing_confidence,sets(name),rarities(code))"
    )
    .in("pricing_state", ["LIVE", "FROZEN"]);

  if (error || !data) {
    console.warn("Falling back to static card prices:", error?.message);
    return liveCards;
  }

  const rows = data as CardVersionPriceRow[];
  const wantedCards = rows
    .map(createWantedCardFromDatabase)
    .filter((card): card is Card => Boolean(card));
  liveCards.push(...wantedCards);
  const versionIds = rows.map((row) => row.id).filter(Boolean);
  const latestSnapshotsByVersionId = new Map<string, PriceSnapshotRow>();
  const collectorStateByCardAndVersion = new Map<string, MarketStateCollectorRow>();

  const { data: marketStates, error: marketStateError } = await supabase
    .from("market_states")
    .select(
      "card_code,version,collector_price_php,collector_price_confidence,verified_sale_low_php,verified_sale_median_php,verified_sale_high_php,verified_sale_count,reseller_ask_low_php,reseller_ask_median_php,reseller_ask_high_php,reseller_ask_count,quick_sale_price_php,collector_tier,collector_price_updated_at,collector_pricing_rule_version,demand_score,scarcity_score,direct_evidence_count,modeled_evidence_count"
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
      version.demandScore = collectorState.demand_score ?? version.demandScore;
      version.scarcityScore = collectorState.scarcity_score ?? version.scarcityScore;
      version.directEvidence = collectorState.direct_evidence_count ?? version.directEvidence;
      version.modeledEvidence = collectorState.modeled_evidence_count ?? version.modeledEvidence;
      version.confidence =
        collectorState.collector_price_confidence === "HIGH"
          ? "High"
          : collectorState.collector_price_confidence === "MEDIUM"
            ? "Moderate"
            : "Low";
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
