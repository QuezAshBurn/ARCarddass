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
  | "RUN_SCHEDULED_MARKET_PRICING"
  | "SKIP_AUTOMATIC_PRICING";

export type InitialPricingCandidates = {
  highestCredibleRawAskPhp?: number;
  highestVerifiedRawSalePhp?: number;
  highestGradeImpliedRawPhp?: number;
  highestDamageAdjustedNmPhp?: number;
};

export type MarketReferenceBucket = "SOLD" | "ASKING" | "FORMULA";

export type MarketReferenceCandidate = {
  bucket: MarketReferenceBucket;
  label: string;
  pricePhp?: number | null;
};

export type MarketReferenceSelection = {
  bucket: MarketReferenceBucket;
  label: string;
  pricePhp: number;
};

export type PrioritizedMarketReferenceCandidate = {
  id: string;
  eventType: string;
  eventAt: string;
  discoveredAt: string;
  isGraded: boolean;
  pricePhp: number | null;
  rawEquivalentPricePhp: number | null;
};

export type PrioritizedMarketReference = {
  eventId: string;
  pricePhp: number;
  priority: "RAW_SOLD_90_DAYS" | "RAW_ACTIVE_ASK" | "GRADED_TO_RAW_FALLBACK";
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
      return "RUN_SCHEDULED_MARKET_PRICING";
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

export function selectHighestMarketReference(
  candidates: MarketReferenceCandidate[]
): MarketReferenceSelection {
  const validCandidates = candidates
    .map((candidate) => ({
      ...candidate,
      pricePhp:
        typeof candidate.pricePhp === "number" && Number.isFinite(candidate.pricePhp)
          ? Math.round(candidate.pricePhp)
          : null
    }))
    .filter(
      (candidate): candidate is MarketReferenceSelection =>
        typeof candidate.pricePhp === "number" && candidate.pricePhp > 0
    );

  if (validCandidates.length === 0) {
    throw new Error("At least one market reference candidate is required.");
  }

  return validCandidates.reduce((winner, candidate) =>
    candidate.pricePhp > winner.pricePhp ? candidate : winner
  );
}

export function selectPublishedMarketReference(
  candidates: MarketReferenceCandidate[]
): MarketReferenceSelection {
  const rawMarketCandidates = candidates.filter((candidate) => candidate.bucket !== "FORMULA");

  if (rawMarketCandidates.some((candidate) => typeof candidate.pricePhp === "number" && candidate.pricePhp > 0)) {
    return selectHighestMarketReference(rawMarketCandidates);
  }

  return selectHighestMarketReference(candidates);
}

/**
 * Chooses the public price reference in the collector-approved order.
 *
 * A raw completed sale in the last 90 days always wins, even where a live
 * seller is asking more. A raw active ask is used only when there is no such
 * sale. Graded evidence is deliberately a final fallback and must already
 * carry a documented raw-equivalent value.
 */
export function selectPrioritizedMarketReference(
  candidates: PrioritizedMarketReferenceCandidate[],
  now = new Date(),
  activeAskMaxAgeHours = 12
): PrioritizedMarketReference | null {
  const soldCutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000;
  const askCutoff = now.getTime() - activeAskMaxAgeHours * 60 * 60 * 1000;
  const validPrice = (value: number | null): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0;
  const highest = (items: PrioritizedMarketReferenceCandidate[], priceFor: (item: PrioritizedMarketReferenceCandidate) => number | null) =>
    items.reduce<PrioritizedMarketReferenceCandidate | null>((winner, item) => {
      const price = priceFor(item);
      if (!validPrice(price)) return winner;
      if (!winner || price > (priceFor(winner) ?? 0)) return item;
      return winner;
    }, null);

  const rawSales = candidates.filter(
    (candidate) =>
      !candidate.isGraded &&
      candidate.eventType === "VERIFIED_SALE" &&
      new Date(candidate.eventAt).getTime() >= soldCutoff &&
      validPrice(candidate.pricePhp)
  );
  const highestRawSale = highest(rawSales, (candidate) => candidate.pricePhp);
  if (highestRawSale && validPrice(highestRawSale.pricePhp)) {
    return {
      eventId: highestRawSale.id,
      pricePhp: Math.round(highestRawSale.pricePhp),
      priority: "RAW_SOLD_90_DAYS"
    };
  }

  const rawAsks = candidates.filter(
    (candidate) =>
      !candidate.isGraded &&
      ["ACTIVE_LISTING", "NEW_LISTING"].includes(candidate.eventType) &&
      new Date(candidate.discoveredAt).getTime() >= askCutoff &&
      validPrice(candidate.pricePhp)
  );
  const highestRawAsk = highest(rawAsks, (candidate) => candidate.pricePhp);
  if (highestRawAsk && validPrice(highestRawAsk.pricePhp)) {
    return {
      eventId: highestRawAsk.id,
      pricePhp: Math.round(highestRawAsk.pricePhp),
      priority: "RAW_ACTIVE_ASK"
    };
  }

  const gradedFallbacks = candidates.filter((candidate) => {
    if (!candidate.isGraded || !validPrice(candidate.rawEquivalentPricePhp)) return false;

    if (candidate.eventType === "VERIFIED_SALE") {
      return new Date(candidate.eventAt).getTime() >= soldCutoff;
    }

    return (
      ["ACTIVE_LISTING", "NEW_LISTING"].includes(candidate.eventType) &&
      new Date(candidate.discoveredAt).getTime() >= askCutoff
    );
  });
  const highestGradedFallback = highest(gradedFallbacks, (candidate) => candidate.rawEquivalentPricePhp);
  if (highestGradedFallback && validPrice(highestGradedFallback.rawEquivalentPricePhp)) {
    return {
      eventId: highestGradedFallback.id,
      pricePhp: Math.round(highestGradedFallback.rawEquivalentPricePhp),
      priority: "GRADED_TO_RAW_FALLBACK"
    };
  }

  return null;
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

export function modelVersionPrices(anchor: "JP" | "EN" | "HK", anchorPricePhp: number) {
  if (anchor === "JP") {
    return {
      JP: Math.round(anchorPricePhp),
      EN: Math.round(anchorPricePhp * versionRelationships.JP_TO_EN),
      HK: Math.round(anchorPricePhp * versionRelationships.JP_TO_HK),
      primaryAnchor: "JP"
    };
  }

  if (anchor === "EN") {
    const jp = anchorPricePhp * versionRelationships.EN_TO_JP;

    return {
      JP: Math.round(jp),
      EN: Math.round(anchorPricePhp),
      HK: Math.round(jp * versionRelationships.JP_TO_HK),
      primaryAnchor: "EN"
    };
  }

  const jp = anchorPricePhp * versionRelationships.HK_TO_JP;

  return {
    JP: Math.round(jp),
    EN: Math.round(jp * versionRelationships.JP_TO_EN),
    HK: Math.round(anchorPricePhp),
    primaryAnchor: "HK"
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
