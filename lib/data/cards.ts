export type PricingState =
  | "UNINITIALIZED"
  | "INITIALIZED"
  | "LIVE"
  | "FROZEN"
  | "REBASE_PENDING";

export type CardVersion = {
  id: string;
  versionCode: "JP" | "EN" | "CN" | "HK";
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
  cardNumber: string;
  characterName: string;
  formationSet: string;
  rarity: "KR" | "SKR";
  category: string;
  pricingTier: 1;
  pricingEnabled: boolean;
  catalogueStatus: "live" | "seeded";
  accentA: string;
  accentB: string;
  summary: string;
  frontImagePath: string;
  versions: CardVersion[];
  priceHistory: PricePoint[];
};

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
  const cn = Math.round(jp * 0.85);
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
      versionRelationship: "EN = JP Ãƒâ€” 0.90",
      currentPublishedPricePhp: en,
      initialReferencePricePhp: Math.round(en * 0.93),
      highWaterReferencePhp: Math.round(en * 1.08),
      highestVerifiedSalePhp: Math.round(en * 1.01),
      weeklyChangePhp: Math.round(changePhp * 0.9),
      weeklyChangePercent: changePercent * 100,
      demandScore: Math.max(0, demandScore - 3),
      scarcityScore,
      confidence,
      directEvidence: 2,
      modeledEvidence: 2
    },
    {
      id: `${cardNumber}-CN`,
      versionCode: "CN",
      language: "Chinese",
      region: "Greater China",
      verificationStatus: "modeled",
      pricingState: "LIVE",
      versionRelationship: "CN = JP Ãƒâ€” 0.85",
      currentPublishedPricePhp: cn,
      initialReferencePricePhp: Math.round(cn * 0.93),
      highWaterReferencePhp: Math.round(cn * 1.08),
      highestVerifiedSalePhp: Math.round(cn * 1.01),
      weeklyChangePhp: Math.round(changePhp * 0.85),
      weeklyChangePercent: changePercent * 100,
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
    versions: [
      ...makeVersions("F02-20", 160000, 0.026, 83, 90, "High"),
      {
        id: "F02-20-HK",
        versionCode: "HK",
        language: "Chinese",
        region: "Hong Kong",
        verificationStatus: "confirmed",
        pricingState: "LIVE",
        versionRelationship: "Direct ARS 10 anchor, JP reverse-modeled",
        currentPublishedPricePhp: 137750,
        initialReferencePricePhp: 132400,
        highWaterReferencePhp: 154000,
        highestVerifiedSalePhp: 151800,
        weeklyChangePhp: 3400,
        weeklyChangePercent: 2.53,
        demandScore: 85,
        scarcityScore: 90,
        confidence: "High",
        directEvidence: 3,
        modeledEvidence: 1
      }
    ],
    priceHistory: makeHistory(132500, 0.0296)
  },
  {
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
    lastMarketUpdate: "2026-08-04 09:00 PHT",
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

export function getSetCode(cardNumber: string): "F01" | "F02" | "F03" | "F04" {
  const setCode = cardNumber.slice(0, 3).toUpperCase();

  if (setCode === "F01" || setCode === "F02" || setCode === "F03" || setCode === "F04") {
    return setCode;
  }

  return "F01";
}



