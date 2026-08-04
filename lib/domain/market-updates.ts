import type { Card, CardVersion } from "@/lib/data/cards";
import { getPrimaryVersion } from "@/lib/data/cards";
import { calculateWeeklyMarketPrice } from "@/lib/domain/pricing";

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function buildMarketInputForVersion(version: CardVersion) {
  const verifiedSaleCount = version.directEvidence >= 4 ? 2 : version.directEvidence > 0 ? 1 : 0;

  return {
    currentPublishedPricePhp: version.currentPublishedPricePhp,
    verifiedSaleCount,
    hasFreshMaterialEvidence: true,
    hasMajorOutlier: false,
    transactionScore: clampScore(50 + version.weeklyChangePercent * 4),
    buyerIntentScore: clampScore(version.demandScore),
    searchDemandScore: clampScore(45 + version.demandScore * 0.35),
    scarcityScore: clampScore(version.scarcityScore),
    priceMomentumScore: clampScore(50 + version.weeklyChangePercent * 5),
    marketBreadthScore: clampScore(30 + version.directEvidence * 12 + version.modeledEvidence * 4)
  };
}

export function calculateMarketUpdateForVersion(card: Card, version: CardVersion) {
  const input = buildMarketInputForVersion(version);
  const result = calculateWeeklyMarketPrice(input);

  return {
    cardNumber: card.cardNumber,
    characterName: card.characterName,
    rarity: card.rarity,
    versionId: version.id,
    versionCode: version.versionCode,
    pricingState: version.pricingState,
    basePublishedPricePhp: version.currentPublishedPricePhp,
    previousWeeklyChangePhp: version.weeklyChangePhp,
    previousWeeklyChangePercent: version.weeklyChangePercent,
    input,
    result,
    nextPublishedPricePhp: result.calculatedPricePhp,
    nextWeeklyChangePhp: result.calculatedPricePhp - version.currentPublishedPricePhp
  };
}

export function calculateMarketUpdatesForPrimaryCards(cards: Card[]) {
  return cards
    .filter((card) => card.pricingEnabled)
    .map((card) => calculateMarketUpdateForVersion(card, getPrimaryVersion(card)));
}

export function calculateMarketUpdatesForAllLiveVersions(cards: Card[]) {
  return cards.flatMap((card) =>
    card.versions
      .filter((version) => version.pricingState === "LIVE")
      .map((version) => calculateMarketUpdateForVersion(card, version))
  );
}
