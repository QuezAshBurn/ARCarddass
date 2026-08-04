import {
  conditionNmMultipliers,
  gradeMultipliers,
  kpiWeights,
  movementCaps,
  versionRelationships
} from "@/config/pricing-rules";
import type { PricingState } from "@/lib/data/cards";

export type PricingAction =
  | "RUN_INITIAL_PRICING"
  | "RUN_WEEKLY_MARKET_PRICING"
  | "SKIP_AUTOMATIC_PRICING";

export type InitialPricingCandidates = {
  highestCredibleRawAskPhp?: number;
  highestVerifiedRawSalePhp?: number;
  highestGradeImpliedRawPhp?: number;
  highestDamageAdjustedNmPhp?: number;
};

export type MarketScoreInput = {
  transactionScore?: number;
  buyerIntentScore?: number;
  searchDemandScore?: number;
  scarcityScore?: number;
  priceMomentumScore?: number;
  marketBreadthScore?: number;
};

export type WeeklyPricingInput = MarketScoreInput & {
  currentPublishedPricePhp: number;
  verifiedSaleCount: number;
  hasFreshMaterialEvidence: boolean;
  hasMajorOutlier: boolean;
};

export function selectAutomaticPricingAction(state: PricingState): PricingAction {
  switch (state) {
    case "UNINITIALIZED":
      return "RUN_INITIAL_PRICING";
    case "LIVE":
      return "RUN_WEEKLY_MARKET_PRICING";
    case "INITIALIZED":
    case "FROZEN":
    case "REBASE_PENDING":
      return "SKIP_AUTOMATIC_PRICING";
  }
}

export function calculateInitialReferencePrice(
  candidates: InitialPricingCandidates
): number {
  const values = Object.values(candidates).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value)
  );

  if (values.length === 0) {
    throw new Error("At least one initial-pricing candidate is required.");
  }

  return Math.max(...values);
}

export function reverseGradedRawValue(
  gradedPricePhp: number,
  grader: keyof typeof gradeMultipliers,
  grade: string
): number {
  const multiplier =
    gradeMultipliers[grader][grade as keyof (typeof gradeMultipliers)[typeof grader]];

  if (!multiplier) {
    throw new Error(`Unsupported grade multiplier: ${grader} ${grade}`);
  }

  return Math.round(gradedPricePhp / multiplier);
}

export function adjustConditionToNearMint(
  pricePhp: number,
  condition: keyof typeof conditionNmMultipliers
): number {
  return Math.round(pricePhp * conditionNmMultipliers[condition]);
}

export function modelVersionPrices(anchor: "JP" | "EN" | "CN", anchorPricePhp: number) {
  if (anchor === "JP") {
    return {
      JP: Math.round(anchorPricePhp),
      EN: Math.round(anchorPricePhp * versionRelationships.JP_TO_EN),
      CN: Math.round(anchorPricePhp * versionRelationships.JP_TO_CN),
      primaryAnchor: "JP"
    };
  }

  if (anchor === "EN") {
    const jp = anchorPricePhp * versionRelationships.EN_TO_JP;

    return {
      JP: Math.round(jp),
      EN: Math.round(anchorPricePhp),
      CN: Math.round(jp * versionRelationships.JP_TO_CN),
      primaryAnchor: "EN"
    };
  }

  const jp = anchorPricePhp * versionRelationships.CN_TO_JP;

  return {
    JP: Math.round(jp),
    EN: Math.round(jp * versionRelationships.JP_TO_EN),
    CN: Math.round(anchorPricePhp),
    primaryAnchor: "CN"
  };
}

export function calculateMarketScore(input: MarketScoreInput): number {
  const available = [
    ["transaction", input.transactionScore, kpiWeights.transaction],
    ["buyerIntent", input.buyerIntentScore, kpiWeights.buyerIntent],
    ["searchDemand", input.searchDemandScore, kpiWeights.searchDemand],
    ["scarcity", input.scarcityScore, kpiWeights.scarcity],
    ["priceMomentum", input.priceMomentumScore, kpiWeights.priceMomentum],
    ["marketBreadth", input.marketBreadthScore, kpiWeights.marketBreadth]
  ] as const;

  const populated = available.filter(([, value]) => typeof value === "number");
  const weightTotal = populated.reduce((sum, [, , weight]) => sum + weight, 0);

  if (weightTotal === 0) {
    return 50;
  }

  const score = populated.reduce(
    (sum, [, value, weight]) => sum + (value ?? 50) * (weight / weightTotal),
    0
  );

  return Math.round(score * 100) / 100;
}

export function getMovementCap(verifiedSaleCount: number): number {
  if (verifiedSaleCount <= 0) {
    return movementCaps.noVerifiedSale;
  }

  if (verifiedSaleCount === 1) {
    return movementCaps.oneIndependentVerifiedSale;
  }

  return movementCaps.multipleIndependentVerifiedSales;
}

export function calculateWeeklyMarketPrice(input: WeeklyPricingInput) {
  if (input.hasMajorOutlier) {
    return {
      status: "HELD_FOR_REVIEW" as const,
      marketScore: calculateMarketScore(input),
      movementCapPercent: 0,
      calculatedMovementPercent: 0,
      calculatedPricePhp: input.currentPublishedPricePhp
    };
  }

  if (!input.hasFreshMaterialEvidence) {
    return {
      status: "NO_EVIDENCE_NO_MOVEMENT" as const,
      marketScore: 50,
      movementCapPercent: 0,
      calculatedMovementPercent: 0,
      calculatedPricePhp: input.currentPublishedPricePhp
    };
  }

  const marketScore = calculateMarketScore(input);
  const movementCap = getMovementCap(input.verifiedSaleCount);
  const rawMovement = ((marketScore - 50) / 50) * movementCap;
  const movement = Math.max(-movementCap, Math.min(movementCap, rawMovement));
  const calculatedPricePhp = Math.round(
    input.currentPublishedPricePhp * (1 + movement)
  );

  return {
    status: "CALCULATED" as const,
    marketScore,
    movementCapPercent: movementCap * 100,
    calculatedMovementPercent: movement * 100,
    calculatedPricePhp
  };
}
