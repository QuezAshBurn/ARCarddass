import type { Card, CardVersion, PricePoint } from "@/lib/data/cards";
import {
  reverseGradedRawValue,
  selectPublishedMarketReference,
  type MarketReferenceCandidate
} from "@/lib/domain/pricing";

type WantedSourceConfidence = NonNullable<Card["researchPricingConfidence"]>;

const USD_TO_PHP_RESEARCH_RATE = 61.29;

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
  lastSoldPhp?: number;
  lastSoldAt?: string;
  lastSoldSource?: string;
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

function rawFromGradedAsk(
  gradedPricePhp: number,
  grader: Parameters<typeof reverseGradedRawValue>[1],
  grade: Parameters<typeof reverseGradedRawValue>[2]
) {
  return reverseGradedRawValue(gradedPricePhp, grader, grade);
}

function usdToPhp(usdAmount: number, fxRate: number) {
  return Math.round(usdAmount * fxRate);
}

function highestMarketReference(candidates: MarketReferenceCandidate[]) {
  return selectPublishedMarketReference(candidates).pricePhp;
}

function isObservedAsk(input: WantedCardInput) {
  return input.sourceConfidence === "Observed listing";
}

function makeWantedVersion(input: WantedCardInput): CardVersion[] {
  const hasLastSold = Boolean(input.lastSoldPhp && input.lastSoldAt);

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
      pricingState: "LIVE",
      versionRelationship:
        input.sourceConfidence === "Modeled estimate" || input.sourceConfidence === "Needs review"
          ? "Highest ask/reference modeled from rarity, SP, character demand, and visible scarcity"
          : "Highest ask/reference captured from public listing research",
      currentPublishedPricePhp: input.highReferencePhp,
      initialReferencePricePhp: input.highReferencePhp,
      highWaterReferencePhp: input.highReferencePhp,
      highestVerifiedSalePhp: hasLastSold ? input.lastSoldPhp ?? 0 : 0,
      weeklyChangePhp: 0,
      weeklyChangePercent: 0,
      lastMarketUpdateAt: null,
      collectorPricePhp: null,
      collectorPriceConfidence: "INSUFFICIENT_DATA",
      verifiedSaleLowPhp: hasLastSold ? input.lastSoldPhp ?? null : null,
      verifiedSaleMedianPhp: hasLastSold ? input.lastSoldPhp ?? null : null,
      verifiedSaleHighPhp: hasLastSold ? input.lastSoldPhp ?? null : null,
      verifiedSaleCount: hasLastSold ? 1 : 0,
      latestVerifiedSaleAt: hasLastSold ? input.lastSoldAt : null,
      resellerAskLowPhp: isObservedAsk(input) ? input.highReferencePhp : null,
      resellerAskMedianPhp: isObservedAsk(input) ? input.highReferencePhp : null,
      resellerAskHighPhp: isObservedAsk(input) ? input.highReferencePhp : null,
      resellerAskCount: isObservedAsk(input) ? 1 : 0,
      quickSalePricePhp: null,
      collectorTier: null,
      collectorPriceUpdatedAt: null,
      collectorPricingRuleVersion: "research-seed-1.1.0",
      demandScore: input.demandScore,
      scarcityScore: input.scarcityScore,
      confidence: hasLastSold
        ? "Moderate"
        : input.sourceConfidence === "Modeled estimate" || input.sourceConfidence === "Needs review"
          ? "Low"
          : "Moderate",
      directEvidence: hasLastSold
        ? 2
        : input.sourceConfidence === "Modeled estimate" || input.sourceConfidence === "Needs review"
          ? 0
          : 1,
      modeledEvidence: hasLastSold
        ? 1
        : input.sourceConfidence === "Modeled estimate" || input.sourceConfidence === "Needs review"
          ? 4
          : 2
    }
  ];
}

function wantedCard(input: WantedCardInput): Card {
  const soldNote = input.lastSoldPhp && input.lastSoldAt
    ? ` Latest sold reference: â‚±${input.lastSoldPhp.toLocaleString("en-PH")} on ${input.lastSoldAt}.`
    : "";

  return {
    productLine: "Wanted",
    cardNumber: input.cardNumber,
    printedNumber: input.printedNumber,
    characterName: input.characterName,
    formationSet: input.set,
    rarity: input.rarity,
    category: input.category,
    pricingTier: 1,
    pricingEnabled: true,
    catalogueStatus: "live",
    accentA: input.accentA,
    accentB: input.accentB,
    summary: `${input.summary} Highest ask/reference: ${input.sourceConfidence.toLowerCase()} at â‚±${input.highReferencePhp.toLocaleString("en-PH")}.${soldNote}`,
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
    summary: "Core Straw Hat character with direct high-ask evidence and steady collector demand.",
    frontImagePath: "/assets/card-scans/wanted/w01-05-zoro.png",
    highReferencePhp: 7400,
    source: "Highest ask reference from eBay around US$119.99; Mercari exact Zoro 01-05 asks were lower.",
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
    summary: "Uncommon Straw Hat card held above exact Mercari asks because public high-ask coverage is still thin.",
    frontImagePath: "/assets/card-scans/wanted/w01-10-sanji.png",
    highReferencePhp: 4500,
    source: "Modeled high ask after reviewing Mercari exact Sanji 01-10 asks and broader Straw Hat Wanted scarcity.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%B5%E3%83%B3%E3%82%B8%2001-10",
    sourceConfidence: "Needs review",
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
    summary: "Highest visible Chopper reference compares raw marketplace asks against graded-implied raw value.",
    frontImagePath: "/assets/card-scans/wanted/w01-12-chopper.png",
    highReferencePhp: highestMarketReference([
      { bucket: "ASKING", label: "Raw marketplace ask", pricePhp: 3100 },
      { bucket: "FORMULA", label: "PSA 9 graded ask converted to raw", pricePhp: rawFromGradedAsk(12300, "PSA", "9") }
    ]),
    source: "Highest raw reference selected from raw marketplace ask around â‚±3,100 versus eBay PSA 9/graded ask around â‚±12,300 reversed with PSA 9 Ã· 1.40.",
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
    summary: "Rare card with a much higher active Mercari ask than the prior closed-auction reference.",
    frontImagePath: "/assets/card-scans/wanted/w01-27-boa-hancock.png",
    highReferencePhp: 43300,
    source: "Observed listing trail: previously captured Mercari JP exact Boa Hancock 01-27 around ¥111,111; collector-provided eBay active listing item 800456598933 added for next ask validation.",
    sourceUrl: "https://www.ebay.com/itm/800456598933",
    sourceConfidence: "Observed listing",
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
    summary: "Common card with pirate-captain character demand, but limited exact high-ask evidence.",
    frontImagePath: "/assets/card-scans/wanted/w01-36-kidd.png",
    highReferencePhp: 5600,
    source: "Needs-review high ask from related Kid AR Carddass public listings plus character-demand premium.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%AD%E3%83%83%E3%83%89",
    sourceConfidence: "Needs review",
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
    summary: "Popular character; exact Mercari asks support a modest floor while demand keeps the high ask slightly above raw evidence.",
    frontImagePath: "/assets/card-scans/wanted/w01-39-law.png",
    highReferencePhp: 2500,
    source: "Highest ask reference reviewed from Mercari exact Law 01-39 around Â¥4,555, rounded upward for demand.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%AD%E3%83%BC%2001-39",
    sourceConfidence: "Needs review",
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
    summary: "Main-character demand creates a strong high reference by comparing raw marketplace asks against graded-implied raw value.",
    frontImagePath: "/assets/card-scans/wanted/w02-02-luffy.png",
    highReferencePhp: highestMarketReference([
      { bucket: "ASKING", label: "eBay active raw ask item 278201455485", pricePhp: usdToPhp(303, USD_TO_PHP_RESEARCH_RATE) },
      { bucket: "FORMULA", label: "eBay CGC 10 Pristine ask converted to raw", pricePhp: rawFromGradedAsk(usdToPhp(3500, USD_TO_PHP_RESEARCH_RATE), "CGC", "10 Pristine") }
    ]),
    source: "Highest raw market reference selected from collector-provided eBay active raw ask item 278201455485 at US$303. Graded-to-raw references are tracked only as fallback when no raw market price exists.",
    sourceUrl: "https://www.ebay.com/itm/278201455485",
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
    summary: "Nami keeps the strongest researched Wanted reference by comparing raw marketplace asks against graded-implied raw value.",
    frontImagePath: "/assets/card-scans/wanted/w02-08-nami.png",
    highReferencePhp: highestMarketReference([
      { bucket: "ASKING", label: "Raw marketplace ask", pricePhp: 9200 },
      { bucket: "FORMULA", label: "PSA 10 graded ask converted to raw", pricePhp: rawFromGradedAsk(98100, "PSA", "10") }
    ]),
    source: "Highest raw reference selected from raw marketplace ask around â‚±9,200 versus eBay PSA 10 ask around â‚±98,100 reversed with PSA 10 Ã· 6.00.",
    sourceUrl: "https://www.ebay.com/sch/i.html?_nkw=One+Piece+Nami+Card+AR+Carddass+F+Second+Formation+Rare+02-08+PSA+10",
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
    summary: "Common Wanted reference keeps the raw market floor because graded-to-raw is only a fallback when no raw market price exists.",
    frontImagePath: "/assets/card-scans/wanted/w02-16-robin.png",
    highReferencePhp: highestMarketReference([
      { bucket: "ASKING", label: "Mercari raw-search floor", pricePhp: 2700 },
      { bucket: "FORMULA", label: "eBay PSA 10 ask converted to raw", pricePhp: rawFromGradedAsk(usdToPhp(1100, USD_TO_PHP_RESEARCH_RATE), "PSA", "10") }
    ]),
    source: "Raw marketplace reference retained from Mercari JP exact Robin 02-16 around ¥7,000; PSA 10 graded ask remains a fallback-only signal.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%AD%E3%83%93%E3%83%B3%2002-16",
    sourceConfidence: "Observed listing",
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
    summary: "Common Wanted reference lifted from the prior floor because direct exact pricing remains thin.",
    frontImagePath: "/assets/card-scans/wanted/w02-18-franky.png",
    highReferencePhp: 3500,
    source: "Needs-review high ask from related Franky AR Carddass public listings and Wanted-line scarcity.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%95%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%BC",
    sourceConfidence: "Needs review",
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
    summary: "Observed high ask gives Buggy a stronger reference than most uncommon Wanted cards.",
    frontImagePath: "/assets/card-scans/wanted/w02-22-buggy.png",
    highReferencePhp: highestMarketReference([
      { bucket: "ASKING", label: "eBay raw ask", pricePhp: usdToPhp(119.99, USD_TO_PHP_RESEARCH_RATE) },
      { bucket: "FORMULA", label: "eBay CGC 10 Pristine ask converted to raw", pricePhp: rawFromGradedAsk(usdToPhp(1700, USD_TO_PHP_RESEARCH_RATE), "CGC", "10 Pristine") }
    ]),
    source: "Highest raw market reference selected from eBay around US$119.99 for AR Carddass Second Formation Buggy 02-22; CGC 10 Pristine ask is fallback-only.",
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
    summary: "Ace has direct Mercari ask evidence and a strong character premium.",
    frontImagePath: "/assets/card-scans/wanted/w02-24-ace.png",
    highReferencePhp: 7700,
    source: "Highest ask reference from Mercari JP exact Ace 02-24 around Â¥19,800.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%A8%E3%83%BC%E3%82%B9%2002-24",
    sourceConfidence: "Observed listing",
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
    summary: "Whitebeard receives a modest character-demand premium while exact high asks remain thin.",
    frontImagePath: "/assets/card-scans/wanted/w02-31-whitebeard.png",
    highReferencePhp: 2500,
    source: "Needs-review high ask from Mercari/eBay AR Carddass Whitebeard searches and character-demand premium.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E7%99%BD%E3%81%B2%E3%81%92%2002-31",
    sourceConfidence: "Needs review",
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
    summary: "Rare card with a clear public high-ask reference.",
    frontImagePath: "/assets/card-scans/wanted/w02-35-rayleigh.png",
    highReferencePhp: 12300,
    source: "Highest ask reference from eBay around US$200.00 for AR Carddass Rayleigh 02-35.",
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
    summary: "High SP and UC rarity lift Usopp, but raw market pricing remains preferred over graded-to-raw fallback signals.",
    frontImagePath: "/assets/card-scans/wanted/w03-12-usopp.png",
    highReferencePhp: highestMarketReference([
      { bucket: "ASKING", label: "Wanted-line raw floor", pricePhp: 4800 },
      { bucket: "FORMULA", label: "eBay PSA 10 ask converted to raw", pricePhp: rawFromGradedAsk(usdToPhp(900, USD_TO_PHP_RESEARCH_RATE), "PSA", "10") }
    ]),
    source: "Raw Wanted-line floor retained while PSA 10 ask around US$900 remains fallback-only because raw market pricing exists.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%A6%E3%82%BD%E3%83%83%E3%83%97%2003-12",
    sourceConfidence: "Needs review",
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
    summary: "Common Wanted card with moderate Straw Hat demand and limited public high asks.",
    frontImagePath: "/assets/card-scans/wanted/w03-28-brook.png",
    highReferencePhp: 2000,
    source: "Needs-review high ask from Mercari/eBay Brook AR Carddass searches and Wanted 03 availability.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%96%E3%83%AB%E3%83%83%E3%82%AF%2003-28",
    sourceConfidence: "Needs review",
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
    summary: "Lower-demand common card kept near the modeled floor until stronger high-ask evidence appears.",
    frontImagePath: "/assets/card-scans/wanted/w03-51-caribou.png",
    highReferencePhp: 1800,
    source: "Needs-review high ask from rarity, SP 1500, lower character demand, and sparse public listings.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%AB%E3%83%AA%E3%83%96%E3%83%BC%2003-51",
    sourceConfidence: "Needs review",
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
    summary: "Rare, high-SP Mihawk card; the highest public Mihawk AR reference is related rather than exact.",
    frontImagePath: "/assets/card-scans/wanted/w04-29-mihawk.jpg",
    highReferencePhp: 12200,
    source: "Needs-review high ask from Mercari related Mihawk AR Carddass around Â¥31,233; exact 04-29 still needs confirmation.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%9F%E3%83%9B%E3%83%BC%E3%82%AF%2004-29",
    sourceConfidence: "Needs review",
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
    summary: "Common Wanted 04 card with moderate scarcity but limited exact high-ask evidence.",
    frontImagePath: "/assets/card-scans/wanted/w04-44-jinbei.png",
    highReferencePhp: 2200,
    source: "Needs-review high ask from Jinbei AR Carddass searches, SP 2200, and Wanted 04 availability.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%B8%E3%83%B3%E3%83%99%E3%82%A8%2004-44",
    sourceConfidence: "Needs review",
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
    summary: "Shanks is lifted from the prior low exact ask because related high asks better reflect character demand.",
    frontImagePath: "/assets/card-scans/wanted/w04-60-shanks.png",
    highReferencePhp: 3500,
    source: "Needs-review high ask from related Mercari Shanks AR Carddass around Â¥8,888; exact 04-60 eBay ask was lower.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%B7%E3%83%A3%E3%83%B3%E3%82%AF%E3%82%B9%2004-60",
    sourceConfidence: "Needs review",
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
    summary: "The scan number needs confirmation; pricing is held as a needs-review high ask.",
    frontImagePath: "/assets/card-scans/wanted/w04-arlong.png",
    highReferencePhp: 4300,
    source: "Needs-review high ask from probable UC rarity, SP 3200, scan-visible stats, and incomplete card-number evidence.",
    sourceUrl: "https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%A2%E3%83%BC%E3%83%AD%E3%83%B3",
    sourceConfidence: "Needs review",
    demandScore: 48,
    scarcityScore: 56,
    sp: 3200,
    accentA: "#22c55e",
    accentB: "#1d4ed8"
  })
];
