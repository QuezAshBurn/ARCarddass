import {
  calculateCollectorPrice,
  type CollectorPriceConfidence,
  type CollectorPricingEvidence,
  type CollectorTier
} from "@/lib/domain/collector-pricing";

export type PricingState =
  | "UNINITIALIZED"
  | "INITIALIZED"
  | "LIVE"
  | "FROZEN"
  | "REBASE_PENDING";

export type CardVersion = {
  id: string;
  versionCode: "JP" | "EN" | "HK";
  language: string;
  region: string;
  verificationStatus: "confirmed" | "modeled" | "needs-review";
  pricingState: PricingState;
  versionRelationship: string;
  currentPublishedPricePhp: number;
  initialReferencePricePhp: number;
  highWaterReferencePhp: number;
  highestVerifiedSalePhp: number;
  weeklyChangePhp: number;
  weeklyChangePercent: number;
  lastMarketUpdateAt?: string | null;
  collectorPricePhp: number | null;
  collectorPriceConfidence: CollectorPriceConfidence;
  verifiedSaleLowPhp: number | null;
  verifiedSaleMedianPhp: number | null;
  verifiedSaleHighPhp: number | null;
  verifiedSaleCount: number;
  latestVerifiedSaleAt?: string | null;
  resellerAskLowPhp: number | null;
  resellerAskMedianPhp: number | null;
  resellerAskHighPhp: number | null;
  resellerAskCount: number;
  quickSalePricePhp: number | null;
  collectorTier: CollectorTier | null;
  collectorPriceUpdatedAt: string | null;
  collectorPricingRuleVersion: string;
  demandScore: number;
  scarcityScore: number;
  confidence: "High" | "Moderate" | "Low";
  directEvidence: number;
  modeledEvidence: number;
};

export type PricePoint = {
  week: string;
  pricePhp: number;
};

export type EvidenceRecord = {
  id: string;
  cardNumber: string;
  cardName: string;
  versionCode: CardVersion["versionCode"];
  marketplace: string;
  status: "active" | "sold" | "review";
  evidenceType: "active_ask" | "completed_sale" | "graded_reverse" | "admin_submission";
  originalCurrency: string;
  originalPrice: number;
  phpPrice: number;
  date: string;
  classification: string;
  confidence: number;
  affected: "initialization" | "market-kpi" | "informational" | "held-review";
  sourceUrl: string;
  watchers?: number;
  bids?: number;
};

export type Card = {
  productLine: ProductLine;
  cardNumber: string;
  printedNumber?: string;
  characterName: string;
  formationSet: string;
  rarity: "KR" | "SKR" | "R" | "UC" | "C";
  category: string;
  pricingTier: 1;
  pricingEnabled: boolean;
  catalogueStatus: "live" | "seeded";
  accentA: string;
  accentB: string;
  summary: string;
  frontImagePath: string;
  researchHighPricePhp?: number;
  researchPricingSource?: string;
  researchPricingUrl?: string;
  researchPricingConfidence?: "Observed listing" | "Observed auction high" | "Modeled estimate" | "Needs review";
  versions: CardVersion[];
  priceHistory: PricePoint[];
};

export type ProductLine = "Formation" | "Wanted";

export const productLines: {
  code: ProductLine;
  slug: string;
  name: string;
  status: "live" | "coming-soon";
  shortName: string;
  description: string;
}[] = [
  {
    code: "Formation",
    slug: "formation",
    name: "AR Carddass King Rare",
    status: "live",
    shortName: "King Rare",
    description: "Current live premium launch-card market tracked by this site."
  },
  {
    code: "Wanted",
    slug: "wanted",
    name: "AR Carddass Wanted",
    status: "live",
    shortName: "Wanted",
    description: "Wanted cards use the same market logic as King Rare, with their own independent evidence."
  }
];

const luffyHistory = [
  176000, 178500, 181000, 184000, 187250, 190000, 192250, 194000
];

function makeHistory(base: number, trend: number): PricePoint[] {
  return Array.from({ length: 8 }, (_, index) => ({
    week: `W${25 + index}`,
    pricePhp: Math.round(base * (1 + trend * index))
  }));
}

function makeVersions(
  cardNumber: string,
  basePrice: number,
  changePercent: number,
  demandScore: number,
  scarcityScore: number,
  confidence: CardVersion["confidence"] = "Moderate"
): CardVersion[] {
  const jp = basePrice;
  const en = Math.round(jp * 0.9);
  const hk = Math.round(jp * 0.85);
  const changePhp = Math.round(jp * changePercent);

  return [
    {
      id: `${cardNumber}-JP`,
      versionCode: "JP",
      language: "Japanese",
      region: "Japan",
      verificationStatus: "confirmed",
      pricingState: "LIVE",
      versionRelationship: "Primary anchor",
      currentPublishedPricePhp: jp,
      initialReferencePricePhp: Math.round(jp * 0.93),
      highWaterReferencePhp: Math.round(jp * 1.08),
      highestVerifiedSalePhp: Math.round(jp * 1.02),
      weeklyChangePhp: changePhp,
      weeklyChangePercent: changePercent * 100,
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
      collectorPricingRuleVersion: "1.0.0",
      demandScore,
      scarcityScore,
      confidence,
      directEvidence: 4,
      modeledEvidence: 0
    },
    {
      id: `${cardNumber}-EN`,
      versionCode: "EN",
      language: "English",
      region: "International",
      verificationStatus: "modeled",
      pricingState: "LIVE",
      versionRelationship: "EN = JP x 0.90",
      currentPublishedPricePhp: en,
      initialReferencePricePhp: Math.round(en * 0.93),
      highWaterReferencePhp: Math.round(en * 1.08),
      highestVerifiedSalePhp: Math.round(en * 1.01),
      weeklyChangePhp: Math.round(changePhp * 0.9),
      weeklyChangePercent: changePercent * 100,
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
      collectorPricingRuleVersion: "1.0.0",
      demandScore: Math.max(0, demandScore - 3),
      scarcityScore,
      confidence,
      directEvidence: 2,
      modeledEvidence: 2
    },
    {
      id: `${cardNumber}-HK`,
      versionCode: "HK",
      language: "Chinese",
      region: "CN / TW / HK",
      verificationStatus: "modeled",
      pricingState: "LIVE",
      versionRelationship: "HK = JP x 0.85",
      currentPublishedPricePhp: hk,
      initialReferencePricePhp: Math.round(hk * 0.93),
      highWaterReferencePhp: Math.round(hk * 1.08),
      highestVerifiedSalePhp: Math.round(hk * 1.01),
      weeklyChangePhp: Math.round(changePhp * 0.85),
      weeklyChangePercent: changePercent * 100,
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
      collectorPricingRuleVersion: "1.0.0",
      demandScore: Math.max(0, demandScore - 5),
      scarcityScore: Math.max(0, scarcityScore - 2),
      confidence,
      directEvidence: 1,
      modeledEvidence: 3
    }
  ];
}

export const cards: Card[] = [
  {
    productLine: "Formation",
    cardNumber: "F01-01",
    characterName: "Monkey D. Luffy",
    formationSet: "Formation 01",
    rarity: "KR",
    category: "Premium character",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#d9253f",
    accentB: "#f6b93b",
    summary: "Flagship KR card with broad collector demand and healthy per-update momentum.",
    frontImagePath: "/assets/card-scans/f01-01-luffy.png",
    versions: makeVersions("F01-01", 194000, 0.018, 72, 75, "High"),
    priceHistory: luffyHistory.map((pricePhp, index) => ({
      week: `W${25 + index}`,
      pricePhp
    }))
  },
  {
    productLine: "Formation",
    cardNumber: "F01-37",
    characterName: "Portgas D. Ace",
    formationSet: "Formation 01",
    rarity: "KR",
    category: "Premium character",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#f97316",
    accentB: "#111827",
    summary: "A high-watchlist card where scarcity and character popularity support price.",
    frontImagePath: "/assets/card-scans/f01-37-ace.png",
    versions: makeVersions("F01-37", 86500, 0.022, 78, 90, "High"),
    priceHistory: makeHistory(74600, 0.0227)
  },
  {
    productLine: "Formation",
    cardNumber: "F02-20",
    characterName: "Boa Hancock",
    formationSet: "Formation 02",
    rarity: "KR",
    category: "Premium character",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#ec4899",
    accentB: "#7c3aed",
    summary: "Configured as the first initial-pricing acceptance-test candidate.",
    frontImagePath: "/assets/card-scans/f02-20-boa.png",
    versions: makeVersions("F02-20", 160000, 0.026, 83, 90, "High"),
    priceHistory: makeHistory(132500, 0.0296)
  },
  {
    productLine: "Formation",
    cardNumber: "F02-24",
    characterName: "Crocodile",
    formationSet: "Formation 02",
    rarity: "KR",
    category: "Premium character",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#a16207",
    accentB: "#0f172a",
    summary: "Thin supply and uneven evidence keep the confidence moderate.",
    frontImagePath: "/assets/card-scans/f02-24-crocodile.png",
    versions: makeVersions("F02-24", 60000, -0.004, 49, 75, "Moderate"),
    priceHistory: makeHistory(61700, -0.004)
  },
  {
    productLine: "Formation",
    cardNumber: "F03-03",
    characterName: "Roronoa Zoro",
    formationSet: "Formation 03",
    rarity: "KR",
    category: "Premium character",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#16a34a",
    accentB: "#064e3b",
    summary: "Strong demand and one recent verified sale create capped upward movement.",
    frontImagePath: "/assets/card-scans/f03-03-zoro.png",
    versions: makeVersions("F03-03", 150000, 0.024, 80, 75, "High"),
    priceHistory: makeHistory(128800, 0.0236)
  },
  {
    productLine: "Formation",
    cardNumber: "F03-13",
    characterName: "Sanji",
    formationSet: "Formation 03",
    rarity: "KR",
    category: "Premium character",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#2563eb",
    accentB: "#facc15",
    summary: "Stable update cycle with buyer intent but limited confirmed transaction activity.",
    frontImagePath: "/assets/card-scans/f03-13-sanji.png",
    versions: makeVersions("F03-13", 83500, 0.006, 56, 60, "Moderate"),
    priceHistory: makeHistory(80000, 0.00625)
  },
  {
    productLine: "Formation",
    cardNumber: "F04-13",
    characterName: "Rob Lucci",
    formationSet: "Formation 04",
    rarity: "KR",
    category: "Premium character",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#334155",
    accentB: "#94a3b8",
    summary: "Low active supply but modest search breadth keeps the score near neutral.",
    frontImagePath: "/assets/card-scans/f04-13-lucci.png",
    versions: makeVersions("F04-13", 110000, 0.002, 52, 75, "Moderate"),
    priceHistory: makeHistory(108500, 0.002)
  },
  {
    productLine: "Formation",
    cardNumber: "F04-27",
    characterName: "Sogeking",
    formationSet: "Formation 04",
    rarity: "SKR",
    category: "Secret premium",
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: "#dc2626",
    accentB: "#f59e0b",
    summary: "The launch SKR card, tracked with the same generic pricing-tier rules as KR.",
    frontImagePath: "/assets/card-scans/f04-27-sogeking.png",
    versions: makeVersions("F04-27", 128000, 0.031, 86, 90, "High"),
    priceHistory: makeHistory(108000, 0.026)
  }
];

export const evidenceRecords: EvidenceRecord[] = [
  {
    id: "ev-boa-ars10",
    cardNumber: "F02-20",
    cardName: "Boa Hancock",
    versionCode: "HK",
    marketplace: "Administrator evidence",
    status: "sold",
    evidenceType: "graded_reverse",
    originalCurrency: "AUD",
    originalPrice: 6000,
    phpPrice: 232400,
    date: "2026-08-04",
    classification: "ARS 10 graded sale, raw-implied via 3.50 multiplier",
    confidence: 94,
    affected: "initialization",
    sourceUrl: "#",
    bids: 0
  },
  {
    id: "ev-luffy-sale",
    cardNumber: "F01-01",
    cardName: "Monkey D. Luffy",
    versionCode: "JP",
    marketplace: "eBay API",
    status: "sold",
    evidenceType: "completed_sale",
    originalCurrency: "PHP",
    originalPrice: 92000,
    phpPrice: 92000,
    date: "2026-07-29",
    classification: "Verified raw Near Mint completed sale",
    confidence: 91,
    affected: "market-kpi",
    sourceUrl: "#",
    watchers: 18,
    bids: 7
  },
  {
    id: "ev-ace-ask",
    cardNumber: "F01-37",
    cardName: "Portgas D. Ace",
    versionCode: "JP",
    marketplace: "eBay API",
    status: "active",
    evidenceType: "active_ask",
    originalCurrency: "USD",
    originalPrice: 2350,
    phpPrice: 136300,
    date: "2026-08-03",
    classification: "Active raw listing, high-water reference candidate",
    confidence: 82,
    affected: "informational",
    sourceUrl: "#",
    watchers: 31
  },
  {
    id: "ev-zoro-sale",
    cardNumber: "F03-03",
    cardName: "Roronoa Zoro",
    versionCode: "EN",
    marketplace: "Partner feed",
    status: "sold",
    evidenceType: "completed_sale",
    originalCurrency: "PHP",
    originalPrice: 101000,
    phpPrice: 101000,
    date: "2026-07-31",
    classification: "English version direct sale",
    confidence: 88,
    affected: "market-kpi",
    sourceUrl: "#",
    bids: 4
  },
  {
    id: "ev-sogeking-review",
    cardNumber: "F04-27",
    cardName: "Sogeking",
    versionCode: "JP",
    marketplace: "eBay API",
    status: "review",
    evidenceType: "active_ask",
    originalCurrency: "USD",
    originalPrice: 4200,
    phpPrice: 243600,
    date: "2026-08-02",
    classification: "Major price anomaly, held for review",
    confidence: 63,
    affected: "held-review",
    sourceUrl: "#",
    watchers: 2
  }
];

function mapEvidenceRecordToCollectorEvidence(record: EvidenceRecord): CollectorPricingEvidence {
  const isVerifiedSale = record.status === "sold" && record.evidenceType === "completed_sale";
  const isActiveListing = record.status === "active" && record.evidenceType === "active_ask";

  return {
    id: record.id,
    cardNumber: record.cardNumber,
    version: record.versionCode,
    evidenceType: isVerifiedSale ? "VERIFIED_SALE" : isActiveListing ? "ACTIVE_LISTING" : "OTHER",
    pricePhp: record.phpPrice,
    condition: "NEAR_MINT",
    sellerId: `${record.marketplace}:${record.id}`,
    buyerId: isVerifiedSale ? `buyer:${record.id}` : null,
    platform: record.marketplace,
    eventAt: `${record.date}T00:00:00.000Z`,
    status:
      record.status === "review" || record.affected === "held-review"
        ? "REVIEW_REQUIRED"
        : record.confidence >= 75
          ? "ACCEPTED"
          : record.confidence >= 50
            ? "DISCOUNTED"
            : "QUARANTINED",
    conditionComparability: 1,
    independenceConfidence: record.confidence
  };
}

function mapVersionSeedEvidenceToCollectorEvidence(
  card: Card,
  version: CardVersion
): CollectorPricingEvidence[] {
  const evidence: CollectorPricingEvidence[] = [];

  if (version.resellerAskHighPhp && version.resellerAskHighPhp > 0) {
    evidence.push({
      id: `seed-ask-${version.id}`,
      cardNumber: card.cardNumber,
      version: version.versionCode,
      evidenceType: "ACTIVE_LISTING",
      pricePhp: version.resellerAskHighPhp,
      condition: "NEAR_MINT",
      sellerId: `seed:${card.cardNumber}`,
      platform: card.researchPricingSource ? "Research seed" : "Static seed",
      eventAt: new Date().toISOString(),
      status: version.confidence === "Low" ? "REVIEW_REQUIRED" : "ACCEPTED",
      conditionComparability: 1,
      independenceConfidence: version.confidence === "High" ? 90 : version.confidence === "Moderate" ? 75 : 55
    });
  }

  if (version.highestVerifiedSalePhp > 0 && version.latestVerifiedSaleAt) {
    evidence.push({
      id: `seed-sale-${version.id}`,
      cardNumber: card.cardNumber,
      version: version.versionCode,
      evidenceType: "VERIFIED_SALE",
      pricePhp: version.highestVerifiedSalePhp,
      condition: "NEAR_MINT",
      sellerId: `seed-sale:${card.cardNumber}`,
      buyerId: `seed-buyer:${card.cardNumber}`,
      platform: card.researchPricingSource ? "Research seed" : "Static seed",
      eventAt: version.latestVerifiedSaleAt,
      status: "ACCEPTED",
      conditionComparability: 1,
      independenceConfidence: version.confidence === "High" ? 90 : 75
    });
  }

  return evidence;
}

export function applyCollectorPricingToCards(cardList: Card[]): Card[] {
  const collectorEvidence = evidenceRecords.map(mapEvidenceRecordToCollectorEvidence);

  return cardList.map((card) => ({
    ...card,
    versions: card.versions.map((version) => {
      const versionEvidence = collectorEvidence.filter(
        (evidence) =>
          evidence.cardNumber === card.cardNumber &&
          evidence.version === version.versionCode
      );
      const seededEvidence = mapVersionSeedEvidenceToCollectorEvidence(card, version);
      const result = calculateCollectorPrice({
        evidence: [...versionEvidence, ...seededEvidence],
        demandScore: version.demandScore,
        scarcityScore: version.scarcityScore
      });

      return {
        ...version,
        collectorPricePhp: result.collectorPricePhp,
        collectorPriceConfidence: result.collectorPriceConfidence,
        verifiedSaleLowPhp: result.verifiedSales.lowPhp,
        verifiedSaleMedianPhp: result.verifiedSales.medianPhp,
        verifiedSaleHighPhp: result.verifiedSales.highPhp,
        verifiedSaleCount: result.verifiedSales.count,
        resellerAskLowPhp: result.resellerAsks.lowPhp,
        resellerAskMedianPhp: result.resellerAsks.medianPhp,
        resellerAskHighPhp: result.resellerAsks.highPhp,
        resellerAskCount: result.resellerAsks.count,
        quickSalePricePhp: result.quickSalePricePhp,
        collectorTier: result.collectorTier,
        collectorPriceUpdatedAt: result.collectorPriceUpdatedAt,
        collectorPricingRuleVersion: result.collectorPricingRuleVersion
      };
    })
  }));
}

export function formatPeso(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(value);
}

export function findCard(cardNumber: string): Card | undefined {
  return cards.find(
    (card) => card.cardNumber.toLowerCase() === cardNumber.toLowerCase()
  );
}

export function getPrimaryVersion(card: Card): CardVersion {
  return card.versions[0];
}

export function getProductLineBySlug(slug?: string | null) {
  return productLines.find((line) => line.slug === slug?.toLowerCase());
}

export function getCardsByProductLine(cardList: Card[], productLine?: ProductLine | null) {
  if (!productLine) {
    return cardList;
  }

  return cardList.filter((card) => card.productLine === productLine);
}

export function getProductLineSetLabel(productLine: ProductLine, setCode: string) {
  if (productLine === "Wanted") {
    return `Wanted ${setCode.replace(/^W/i, "")}`;
  }

  return `King Rare ${setCode.replace(/^F/i, "")}`;
}

export function formatMarketUpdateAt(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const getPart = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  return `${getPart("year")}-${getPart("month")}-${getPart("day")} ${getPart("hour")}:${getPart("minute")} PHT`;
}

export function formatMarketUpdateLabel(value?: string | null): string {
  const formatted = formatMarketUpdateAt(value);

  return formatted ? `Updated ${formatted}` : "Awaiting live update";
}

function positivePriceCandidates(values: Array<number | null | undefined>) {
  return values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function getLowMarketFallbackFactor(version: CardVersion) {
  if (version.confidence === "High") return 0.92;
  if (version.confidence === "Moderate") return 0.88;

  return 0.82;
}

export function getLowMarketPrice(version: CardVersion): number {
  const fallbackFloor = Math.round(
    version.currentPublishedPricePhp * getLowMarketFallbackFactor(version)
  );
  const candidates = positivePriceCandidates([
    version.quickSalePricePhp,
    version.verifiedSaleLowPhp,
    version.resellerAskLowPhp,
    version.initialReferencePricePhp,
    fallbackFloor
  ]);

  return Math.min(...candidates, fallbackFloor);
}

export function getHighMarketPrice(version: CardVersion): number {
  const candidates = positivePriceCandidates([
    version.currentPublishedPricePhp,
    version.highWaterReferencePhp,
    version.highestVerifiedSalePhp,
    version.verifiedSaleHighPhp,
    version.resellerAskHighPhp
  ]);

  return Math.max(...candidates, version.currentPublishedPricePhp);
}

export function getMarketRange(version: CardVersion) {
  return {
    lowMarketPhp: getLowMarketPrice(version),
    marketPricePhp: version.currentPublishedPricePhp,
    highMarketPhp: getHighMarketPrice(version)
  };
}

function getLatestMarketUpdateAt(cardList: Card[]): string | null {
  const timestamps = cardList
    .flatMap((card) => card.versions.map((version) => version.lastMarketUpdateAt))
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  return timestamps[0]?.toISOString() ?? null;
}
export function getMarketSummary(cardList: Card[] = cards) {
  const versions = cardList.map((card) => ({
    card,
    version: getPrimaryVersion(card)
  }));

  return {
    totalCards: cardList.length,
    liveVersions: cardList.flatMap((card) => card.versions).filter(
      (version) => version.pricingState === "LIVE"
    ).length,
    lastMarketUpdate: formatMarketUpdateLabel(getLatestMarketUpdateAt(cardList)),
    biggestGainers: [...versions].sort(
      (a, b) => b.version.weeklyChangePercent - a.version.weeklyChangePercent
    ),
    biggestDecliners: [...versions].sort(
      (a, b) => a.version.weeklyChangePercent - b.version.weeklyChangePercent
    ),
    mostDemanded: [...versions].sort(
      (a, b) => b.version.demandScore - a.version.demandScore
    ),
    scarcest: [...versions].sort(
      (a, b) => b.version.scarcityScore - a.version.scarcityScore
    )
  };
}

export function getSetCode(cardNumber: string): string {
  const setCode = cardNumber.slice(0, 3).toUpperCase();

  if (/^[FW]\d{2}$/.test(setCode)) {
    return setCode;
  }

  return "F01";
}



