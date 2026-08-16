import type { Card, CardVersion, PricePoint } from "@/lib/data/cards";

type WantedSourceConfidence = NonNullable<Card["researchPricingConfidence"]>;

type WantedCardInput = {
  cardNumber: string;
  printedNumber: string;
  characterName: string;
  set: "Wanted 01" | "Wanted 02" | "Wanted 03" | "Wanted 04";
  rarity: "R" | "UC" | "C";
  category: string;
  summary: string;
  frontImagePath: string;
  highReferencePhp: number;
  source: string;
  sourceUrl?: string;
  sourceConfidence: WantedSourceConfidence;
  demandScore: number;
  scarcityScore: number;
  sp: number;
  accentA: string;
  accentB: string;
};

function makeWantedHistory(basePrice: number): PricePoint[] {
  return Array.from({ length: 8 }, (_, index) => ({
    week: `R${index + 1}`,
    pricePhp: basePrice
  }));
}

function makeWantedVersion(input: WantedCardInput): CardVersion[] {
  return [
    {
      id: `${input.cardNumber}-JP`,
      versionCode: "JP",
      language: "Japanese",
      region: "Japan",
      verificationStatus:
        input.sourceConfidence === "Observed listing" ||
        input.sourceConfidence === "Observed auction high"
          ? "confirmed"
          : "needs-review",
      pricingState: "INITIALIZED",
      versionRelationship:
        input.sourceConfidence === "Modeled estimate"
          ? "High reference modeled from rarity, SP, character demand, and visible scarcity"
          : "High reference captured from public listing/auction research",
      currentPublishedPricePhp: input.highReferencePhp,
      initialReferencePricePhp: input.highReferencePhp,
      highWaterReferencePhp: input.highReferencePhp,
      highestVerifiedSalePhp:
        input.sourceConfidence === "Observed auction high" ? input.highReferencePhp : 0,
      weeklyChangePhp: 0,
      weeklyChangePercent: 0,
      lastMarketUpdateAt: null,
      collectorPricePhp: null,
      collectorPriceConfidence: "INSUFFICIENT_DATA",
      verifiedSaleLowPhp: null,
      verifiedSaleMedianPhp: null,
      verifiedSaleHighPhp: null,
      verifiedSaleCount: input.sourceConfidence === "Observed auction high" ? 1 : 0,
      resellerAskLowPhp: input.sourceConfidence === "Observed listing" ? input.highReferencePhp : null,
      resellerAskMedianPhp: input.sourceConfidence === "Observed listing" ? input.highReferencePhp : null,
      resellerAskHighPhp: input.sourceConfidence === "Observed listing" ? input.highReferencePhp : null,
      resellerAskCount: input.sourceConfidence === "Observed listing" ? 1 : 0,
      quickSalePricePhp: null,
      collectorTier: null,
      collectorPriceUpdatedAt: null,
      collectorPricingRuleVersion: "research-seed-1.0.0",
      demandScore: input.demandScore,
      scarcityScore: input.scarcityScore,
      confidence:
        input.sourceConfidence === "Modeled estimate" || input.sourceConfidence === "Needs review"
          ? "Low"
          : "Moderate",
      directEvidence:
        input.sourceConfidence === "Modeled estimate" || input.sourceConfidence === "Needs review"
          ? 0
          : 1,
      modeledEvidence:
        input.sourceConfidence === "Modeled estimate" || input.sourceConfidence === "Needs review"
          ? 4
          : 2
    }
  ];
}

function wantedCard(input: WantedCardInput): Card {
  return {
    productLine: "Wanted",
    cardNumber: input.cardNumber,
    printedNumber: input.printedNumber,
    characterName: input.characterName,
    formationSet: input.set,
    rarity: input.rarity,
    category: input.category,
    pricingTier: 1,
    pricingEnabled: false,
    catalogueStatus: "seeded",
    accentA: input.accentA,
    accentB: input.accentB,
    summary: `${input.summary} High reference: ${input.sourceConfidence.toLowerCase()} at ₱${input.highReferencePhp.toLocaleString("en-PH")}.`,
    frontImagePath: input.frontImagePath,
    researchHighPricePhp: input.highReferencePhp,
    researchPricingSource: input.source,
    researchPricingUrl: input.sourceUrl,
    researchPricingConfidence: input.sourceConfidence,
    versions: makeWantedVersion(input),
    priceHistory: makeWantedHistory(input.highReferencePhp)
  };
}

export const wantedCards: Card[] = [
  wantedCard({
    cardNumber: "W01-05",
    printedNumber: "NO.01-05",
    characterName: "Roronoa Zoro",
    set: "Wanted 01",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Core Straw Hat character with direct high-listing evidence and steady collector demand.",
    frontImagePath: "/assets/card-scans/wanted/w01-05-zoro.png",
    highReferencePhp: 7400,
    source: "Observed eBay listing around US$119.99 for 2011 AR Carddass Zoro Wanted.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=2011+One+Piece+AR+Carddass+Zoro+Wanted+No.+01-05",
    sourceConfidence: "Observed listing",
    demandScore: 82,
    scarcityScore: 64,
    sp: 1700,
    accentA: "#16a34a",
    accentB: "#0f5132"
  }),
  wantedCard({
    cardNumber: "W01-10",
    printedNumber: "NO.01-10",
    characterName: "Sanji",
    set: "Wanted 01",
    rarity: "UC",
    category: "Wanted poster character",
    summary: "Uncommon Straw Hat card modeled below Zoro/Luffy but above common low-SP references.",
    frontImagePath: "/assets/card-scans/wanted/w01-10-sanji.png",
    highReferencePhp: 4500,
    source: "Modeled from UC rarity, SP 2900, Straw Hat demand, and Wanted-line scarcity.",
    sourceConfidence: "Modeled estimate",
    demandScore: 72,
    scarcityScore: 58,
    sp: 2900,
    accentA: "#facc15",
    accentB: "#1f2937"
  }),
  wantedCard({
    cardNumber: "W01-12",
    printedNumber: "NO.01-12",
    characterName: "Tony Tony Chopper",
    set: "Wanted 01",
    rarity: "UC",
    category: "Wanted poster character",
    summary: "Visible public ask supports a modest high reference for this uncommon card.",
    frontImagePath: "/assets/card-scans/wanted/w01-12-chopper.png",
    highReferencePhp: 3100,
    source: "Observed eBay listing around US$49.97 for Wanted Poster Chopper 01-12.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=one+piece+AR+carddass+wanted+poster+chopper+01-12",
    sourceConfidence: "Observed listing",
    demandScore: 68,
    scarcityScore: 54,
    sp: 2600,
    accentA: "#f97316",
    accentB: "#ef4444"
  }),
  wantedCard({
    cardNumber: "W01-27",
    printedNumber: "NO.01-27",
    characterName: "Boa Hancock",
    set: "Wanted 01",
    rarity: "R",
    category: "Rare Wanted poster character",
    summary: "Rare card with the strongest Yahoo closed-auction signal found during this pass.",
    frontImagePath: "/assets/card-scans/wanted/w01-27-boa-hancock.png",
    highReferencePhp: 8100,
    source: "Yahoo Japan closed-auction high reference around ¥20,800 for AR Carddass Hancock.",
    sourceUrl: "https://auctions.yahoo.co.jp/closedsearch/closedsearch/AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%8F%E3%83%B3%E3%82%B3%E3%83%83%E3%82%AF/0/",
    sourceConfidence: "Observed auction high",
    demandScore: 84,
    scarcityScore: 72,
    sp: 3300,
    accentA: "#ec4899",
    accentB: "#7c3aed"
  }),
  wantedCard({
    cardNumber: "W01-36",
    printedNumber: "NO.01-36",
    characterName: "Eustass Kid",
    set: "Wanted 01",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Common card with pirate-captain character demand, but limited direct pricing evidence.",
    frontImagePath: "/assets/card-scans/wanted/w01-36-kidd.png",
    highReferencePhp: 1600,
    source: "Modeled from C rarity, SP 1400, character demand, and sparse public listings.",
    sourceConfidence: "Modeled estimate",
    demandScore: 58,
    scarcityScore: 45,
    sp: 1400,
    accentA: "#dc2626",
    accentB: "#6d28d9"
  }),
  wantedCard({
    cardNumber: "W01-39",
    printedNumber: "NO.01-39",
    characterName: "Trafalgar Law",
    set: "Wanted 01",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Popular character, but this specific common Wanted reference still needs direct comps.",
    frontImagePath: "/assets/card-scans/wanted/w01-39-law.png",
    highReferencePhp: 2500,
    source: "Modeled from C rarity, Law demand premium, SP 1300, and low visible circulation.",
    sourceConfidence: "Modeled estimate",
    demandScore: 78,
    scarcityScore: 52,
    sp: 1300,
    accentA: "#06b6d4",
    accentB: "#1e3a8a"
  }),
  wantedCard({
    cardNumber: "W02-02",
    printedNumber: "NO.02-02",
    characterName: "Monkey D. Luffy",
    set: "Wanted 02",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Main-character demand creates the largest high reference among common Wanted cards.",
    frontImagePath: "/assets/card-scans/wanted/w02-02-luffy.png",
    highReferencePhp: 14000,
    source: "Observed public listings around £170.23 / C$253.26 for Wanted Luffy 02-02.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=One+Piece+AR+Carddass+Formation+02+Luffy+02-02",
    sourceConfidence: "Observed listing",
    demandScore: 90,
    scarcityScore: 66,
    sp: 1500,
    accentA: "#ef4444",
    accentB: "#f59e0b"
  }),
  wantedCard({
    cardNumber: "W02-08",
    printedNumber: "NO.02-08",
    characterName: "Nami",
    set: "Wanted 02",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Direct high-listing evidence puts Nami well above most common Wanted references.",
    frontImagePath: "/assets/card-scans/wanted/w02-08-nami.png",
    highReferencePhp: 9200,
    source: "Observed eBay listing around US$149.99 for AR Carddass Wanted Nami 02-08.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=One+Piece+Nami+Card+AR+Carddass+Wanted+Poster+No.02-08",
    sourceConfidence: "Observed listing",
    demandScore: 80,
    scarcityScore: 60,
    sp: 1700,
    accentA: "#fb923c",
    accentB: "#0ea5e9"
  }),
  wantedCard({
    cardNumber: "W02-16",
    printedNumber: "NO.02-16",
    characterName: "Nico Robin",
    set: "Wanted 02",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Common Wanted reference with character demand, but no strong direct high comp yet.",
    frontImagePath: "/assets/card-scans/wanted/w02-16-robin.png",
    highReferencePhp: 1900,
    source: "Modeled from C rarity, SP 1300, Robin demand, and sparse public comps.",
    sourceConfidence: "Modeled estimate",
    demandScore: 70,
    scarcityScore: 48,
    sp: 1300,
    accentA: "#7c3aed",
    accentB: "#1e1b4b"
  }),
  wantedCard({
    cardNumber: "W02-18",
    printedNumber: "NO.02-18",
    characterName: "Franky",
    set: "Wanted 02",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Common Wanted reference modeled from SP and lower visible demand than top Straw Hats.",
    frontImagePath: "/assets/card-scans/wanted/w02-18-franky.png",
    highReferencePhp: 1400,
    source: "Modeled from C rarity, SP 1400, and limited visible high-price evidence.",
    sourceConfidence: "Modeled estimate",
    demandScore: 50,
    scarcityScore: 42,
    sp: 1400,
    accentA: "#06b6d4",
    accentB: "#f97316"
  }),
  wantedCard({
    cardNumber: "W02-22",
    printedNumber: "NO.02-22",
    characterName: "Buggy",
    set: "Wanted 02",
    rarity: "UC",
    category: "Wanted poster character",
    summary: "Observed high listing gives Buggy a stronger reference than most uncommon cards.",
    frontImagePath: "/assets/card-scans/wanted/w02-22-buggy.png",
    highReferencePhp: 7400,
    source: "Observed eBay listing around US$119.99 for AR Carddass Second Formation Buggy 02-22.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=One+Piece+AR+Carddass+Buggy+02-22",
    sourceConfidence: "Observed listing",
    demandScore: 64,
    scarcityScore: 58,
    sp: 3300,
    accentA: "#8b5cf6",
    accentB: "#ef4444"
  }),
  wantedCard({
    cardNumber: "W02-24",
    printedNumber: "NO.02-24",
    characterName: "Portgas D. Ace",
    set: "Wanted 02",
    rarity: "UC",
    category: "Wanted poster character",
    summary: "Character popularity and UC rarity support a higher modeled reference while direct comps are thin.",
    frontImagePath: "/assets/card-scans/wanted/w02-24-ace.png",
    highReferencePhp: 5200,
    source: "Modeled from UC rarity, SP 3100, Ace character premium, and low visible circulation.",
    sourceConfidence: "Modeled estimate",
    demandScore: 86,
    scarcityScore: 60,
    sp: 3100,
    accentA: "#f97316",
    accentB: "#dc2626"
  }),
  wantedCard({
    cardNumber: "W02-31",
    printedNumber: "NO.02-31",
    characterName: "Edward Newgate",
    set: "Wanted 02",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Whitebeard gets a modest character-demand premium despite common rarity.",
    frontImagePath: "/assets/card-scans/wanted/w02-31-whitebeard.png",
    highReferencePhp: 2100,
    source: "Modeled from C rarity, SP 1500, Whitebeard demand, and limited public comps.",
    sourceConfidence: "Modeled estimate",
    demandScore: 72,
    scarcityScore: 50,
    sp: 1500,
    accentA: "#94a3b8",
    accentB: "#0f172a"
  }),
  wantedCard({
    cardNumber: "W02-35",
    printedNumber: "NO.02-35",
    characterName: "Silvers Rayleigh",
    set: "Wanted 02",
    rarity: "R",
    category: "Rare Wanted poster character",
    summary: "Rare card with a clear public high listing reference.",
    frontImagePath: "/assets/card-scans/wanted/w02-35-rayleigh.png",
    highReferencePhp: 12300,
    source: "Observed eBay listing around US$200.00 for AR Carddass Rayleigh 02-35.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=One+Piece+Card+AR+Carddass+Second+Formation+02+No.35+SILVERS+RAYLEIGH",
    sourceConfidence: "Observed listing",
    demandScore: 82,
    scarcityScore: 78,
    sp: 4800,
    accentA: "#d1d5db",
    accentB: "#a16207"
  }),
  wantedCard({
    cardNumber: "W03-12",
    printedNumber: "NO.03-12",
    characterName: "Usopp",
    set: "Wanted 03",
    rarity: "UC",
    category: "Wanted poster character",
    summary: "High SP and UC rarity lift Usopp above most common Wanted references.",
    frontImagePath: "/assets/card-scans/wanted/w03-12-usopp.png",
    highReferencePhp: 4800,
    source: "Modeled from UC rarity, SP 3600, Straw Hat demand, and low visible circulation.",
    sourceConfidence: "Modeled estimate",
    demandScore: 62,
    scarcityScore: 58,
    sp: 3600,
    accentA: "#f59e0b",
    accentB: "#7c2d12"
  }),
  wantedCard({
    cardNumber: "W03-28",
    printedNumber: "NO.03-28",
    characterName: "Brook",
    set: "Wanted 03",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Common Wanted card with moderate Straw Hat demand and no strong public high comp yet.",
    frontImagePath: "/assets/card-scans/wanted/w03-28-brook.png",
    highReferencePhp: 1800,
    source: "Modeled from C rarity, SP 1800, and limited direct market references.",
    sourceConfidence: "Modeled estimate",
    demandScore: 54,
    scarcityScore: 45,
    sp: 1800,
    accentA: "#f97316",
    accentB: "#111827"
  }),
  wantedCard({
    cardNumber: "W03-51",
    printedNumber: "NO.03-51",
    characterName: "Caribou",
    set: "Wanted 03",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Low-demand common card kept near the modeled floor until better evidence appears.",
    frontImagePath: "/assets/card-scans/wanted/w03-51-caribou.png",
    highReferencePhp: 1400,
    source: "Modeled from C rarity, SP 1500, lower character demand, and sparse listings.",
    sourceConfidence: "Modeled estimate",
    demandScore: 35,
    scarcityScore: 42,
    sp: 1500,
    accentA: "#84cc16",
    accentB: "#14532d"
  }),
  wantedCard({
    cardNumber: "W04-29",
    printedNumber: "NO.04-29",
    characterName: "Dracule Mihawk",
    set: "Wanted 04",
    rarity: "R",
    category: "Rare Wanted poster character",
    summary: "Rare, high-SP Mihawk card; no clean direct comp surfaced, so this stays modeled.",
    frontImagePath: "/assets/card-scans/wanted/w04-29-mihawk.jpg",
    highReferencePhp: 12000,
    source: "Modeled from R rarity, SP 5100, high character demand, and Wanted 04 scarcity.",
    sourceConfidence: "Modeled estimate",
    demandScore: 84,
    scarcityScore: 76,
    sp: 5100,
    accentA: "#111827",
    accentB: "#dc2626"
  }),
  wantedCard({
    cardNumber: "W04-44",
    printedNumber: "NO.04-44",
    characterName: "Jinbei",
    set: "Wanted 04",
    rarity: "C",
    category: "Wanted poster character",
    summary: "Common Wanted 04 card with moderate scarcity but limited direct price evidence.",
    frontImagePath: "/assets/card-scans/wanted/w04-44-jinbei.png",
    highReferencePhp: 2000,
    source: "Modeled from C rarity, SP 2200, and Wanted 04 availability.",
    sourceConfidence: "Modeled estimate",
    demandScore: 52,
    scarcityScore: 50,
    sp: 2200,
    accentA: "#0ea5e9",
    accentB: "#1e40af"
  }),
  wantedCard({
    cardNumber: "W04-60",
    printedNumber: "NO.04-60",
    characterName: "Shanks",
    set: "Wanted 04",
    rarity: "UC",
    category: "Wanted poster character",
    summary: "Visible low ask exists, but character demand keeps this under watch for better comps.",
    frontImagePath: "/assets/card-scans/wanted/w04-60-shanks.png",
    highReferencePhp: 1350,
    source: "Observed eBay listing around US$22.00 for AR Carddass Shanks 04-60.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=One+Piece+AR+Carddass+Formation+04+Shanks+04-60",
    sourceConfidence: "Observed listing",
    demandScore: 82,
    scarcityScore: 48,
    sp: 1800,
    accentA: "#dc2626",
    accentB: "#1e293b"
  }),
  wantedCard({
    cardNumber: "W04-ARLONG",
    printedNumber: "NO.04-??",
    characterName: "Arlong",
    set: "Wanted 04",
    rarity: "UC",
    category: "Wanted poster character",
    summary: "The scan number needs confirmation; pricing is held as a modeled high reference.",
    frontImagePath: "/assets/card-scans/wanted/w04-arlong.png",
    highReferencePhp: 4300,
    source: "Modeled from probable UC rarity, SP 3200, scan-visible stats, and incomplete card-number evidence.",
    sourceConfidence: "Needs review",
    demandScore: 48,
    scarcityScore: 56,
    sp: 3200,
    accentA: "#22c55e",
    accentB: "#1d4ed8"
  })
];
