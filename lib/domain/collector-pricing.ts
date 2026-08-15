export type CollectorPriceConfidence = "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
export type CollectorTier = "S" | "A" | "B" | "C";
export type CollectorEvidenceType = "VERIFIED_SALE" | "ACTIVE_LISTING" | "OTHER";
export type CollectorEvidenceStatus =
  | "ACCEPTED"
  | "DISCOUNTED"
  | "QUARANTINED"
  | "REVIEW_REQUIRED"
  | "REJECTED";

export type CollectorPricingEvidence = {
  id: string;
  cardNumber: string;
  version: "JP" | "EN" | "HK";
  evidenceType: CollectorEvidenceType;
  pricePhp: number;
  condition?: string | null;
  sellerId?: string | null;
  buyerId?: string | null;
  platform?: string | null;
  eventAt: string;
  status: CollectorEvidenceStatus;
  duplicateGroupId?: string | null;
  outlierReason?: string | null;
  conditionComparability?: number | null;
  independenceConfidence?: number | null;
};

export type PriceRange = {
  lowPhp: number | null;
  medianPhp: number | null;
  highPhp: number | null;
  count: number;
};

export type CollectorPricingResult = {
  collectorPricePhp: number | null;
  collectorPriceConfidence: CollectorPriceConfidence;
  verifiedSales: PriceRange;
  resellerAsks: PriceRange;
  quickSalePricePhp: number | null;
  collectorTier: CollectorTier | null;
  collectorPriceUpdatedAt: string | null;
  collectorPricingRuleVersion: string;
  excludedReasons: string[];
};

export const collectorPricingRuleVersion = "1.0.0";
const verifiedSaleLookbackDays = 90;

function sortNumbers(values: number[]) {
  return [...values].sort((a, b) => a - b);
}

export function median(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  const sorted = sortNumbers(values);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }

  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function calculateVerifiedSaleRange(evidence: CollectorPricingEvidence[]): PriceRange {
  const prices = sortNumbers(
    evidence
      .filter((item) => item.evidenceType === "VERIFIED_SALE" && item.status === "ACCEPTED")
      .map((item) => Math.round(item.pricePhp))
      .filter((price) => Number.isFinite(price) && price > 0)
  );

  return {
    lowPhp: prices[0] ?? null,
    medianPhp: median(prices),
    highPhp: prices.at(-1) ?? null,
    count: prices.length
  };
}

export function calculateResellerAskRange(evidence: CollectorPricingEvidence[]): PriceRange {
  const prices = sortNumbers(
    evidence
      .filter((item) => item.evidenceType === "ACTIVE_LISTING" && item.status === "ACCEPTED")
      .map((item) => Math.round(item.pricePhp))
      .filter((price) => Number.isFinite(price) && price > 0)
  );

  return {
    lowPhp: prices[0] ?? null,
    medianPhp: median(prices),
    highPhp: prices.at(-1) ?? null,
    count: prices.length
  };
}

export function normalizeConditionPrice(pricePhp: number, conditionComparability = 1) {
  if (!Number.isFinite(pricePhp) || pricePhp <= 0) {
    return null;
  }

  if (!Number.isFinite(conditionComparability) || conditionComparability <= 0) {
    return Math.round(pricePhp);
  }

  return Math.round(pricePhp / Math.min(1, conditionComparability));
}

export function detectCollectorPriceOutlier(pricePhp: number, currentCollectorPricePhp: number | null) {
  if (!currentCollectorPricePhp || currentCollectorPricePhp <= 0) {
    return null;
  }

  if (pricePhp > currentCollectorPricePhp * 1.4) {
    return "Sale is more than 40% above current Collector Price.";
  }

  if (pricePhp < currentCollectorPricePhp * 0.65) {
    return "Sale is more than 35% below current Collector Price.";
  }

  return null;
}

export function calculateCollectorConfidence(evidence: CollectorPricingEvidence[]): CollectorPriceConfidence {
  const sales = evidence.filter(
    (item) => item.evidenceType === "VERIFIED_SALE" && item.status === "ACCEPTED"
  );

  if (sales.length === 0) {
    return "INSUFFICIENT_DATA";
  }

  const independentSellers = new Set(sales.map((item) => item.sellerId ?? item.id)).size;
  const prices = sales.map((item) => item.pricePhp).filter((price) => Number.isFinite(price) && price > 0);
  const low = Math.min(...prices);
  const high = Math.max(...prices);
  const spread = low > 0 ? (high - low) / low : 1;

  if (sales.length >= 5 && independentSellers >= 3 && spread <= 0.25) {
    return "HIGH";
  }

  if (sales.length >= 2 && independentSellers >= 2 && spread <= 0.4) {
    return "MEDIUM";
  }

  return "LOW";
}

export function calculateQuickSalePrice(
  collectorPricePhp: number | null,
  liquidity: "HIGH" | "MEDIUM" | "LOW" = "MEDIUM"
) {
  if (!collectorPricePhp) {
    return null;
  }

  const discount = liquidity === "HIGH" ? 0.93 : liquidity === "LOW" ? 0.82 : 0.88;

  return Math.round(collectorPricePhp * discount);
}

export function calculateCollectorTier(input: {
  demandScore: number;
  scarcityScore: number;
  liquidityScore: number;
  transactionStrengthScore: number;
}): CollectorTier {
  const score =
    input.demandScore * 0.3 +
    input.scarcityScore * 0.3 +
    input.liquidityScore * 0.2 +
    input.transactionStrengthScore * 0.2;

  if (score >= 85) return "S";
  if (score >= 70) return "A";
  if (score >= 55) return "B";

  return "C";
}

function isInsideLookback(eventAt: string, now: Date, days: number) {
  const date = new Date(eventAt);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return now.getTime() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function getEligibleSales(evidence: CollectorPricingEvidence[], now: Date) {
  return evidence
    .filter((item) => item.evidenceType === "VERIFIED_SALE")
    .filter((item) => item.status === "ACCEPTED")
    .filter((item) => !item.duplicateGroupId)
    .filter((item) => !item.outlierReason)
    .filter((item) => isInsideLookback(item.eventAt, now, verifiedSaleLookbackDays))
    .map((item) => ({
      ...item,
      pricePhp: normalizeConditionPrice(item.pricePhp, item.conditionComparability ?? 1) ?? item.pricePhp
    }));
}

function calculateRecentWeightedAverage(sales: CollectorPricingEvidence[], now: Date) {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const sale of sales) {
    const ageDays = Math.max(
      0,
      (now.getTime() - new Date(sale.eventAt).getTime()) / (24 * 60 * 60 * 1000)
    );
    const recencyWeight = Math.max(0.35, 1 - ageDays / verifiedSaleLookbackDays);
    const independenceWeight = Math.max(0.4, (sale.independenceConfidence ?? 100) / 100);
    const weight = recencyWeight * independenceWeight;

    weightedTotal += sale.pricePhp * weight;
    weightTotal += weight;
  }

  return weightTotal > 0 ? Math.round(weightedTotal / weightTotal) : null;
}

export function calculateCollectorPrice(input: {
  evidence: CollectorPricingEvidence[];
  demandScore: number;
  scarcityScore: number;
  currentCollectorPricePhp?: number | null;
  now?: Date;
}): CollectorPricingResult {
  const now = input.now ?? new Date();
  const excludedReasons: string[] = [];
  const eligibleSales = getEligibleSales(input.evidence, now).filter((sale) => {
    const outlierReason = detectCollectorPriceOutlier(sale.pricePhp, input.currentCollectorPricePhp ?? null);

    if (outlierReason) {
      excludedReasons.push(outlierReason);
      return false;
    }

    return true;
  });
  const verifiedSales = calculateVerifiedSaleRange(eligibleSales);
  const resellerAsks = calculateResellerAskRange(input.evidence);
  const confidence = calculateCollectorConfidence(eligibleSales);
  const prices = eligibleSales.map((sale) => sale.pricePhp);
  const medianVerifiedSale = median(prices);
  const recentWeightedAverage = calculateRecentWeightedAverage(eligibleSales, now);
  const collectorPricePhp =
    eligibleSales.length === 0
      ? null
      : eligibleSales.length <= 2
        ? medianVerifiedSale
        : Math.round(
            (medianVerifiedSale ?? 0) * 0.5 +
              (recentWeightedAverage ?? medianVerifiedSale ?? 0) * 0.25 +
              (medianVerifiedSale ?? 0) * 0.15 +
              (medianVerifiedSale ?? 0) * 0.1
          );
  const liquidityScore = Math.min(100, resellerAsks.count * 12 + verifiedSales.count * 15);
  const transactionStrengthScore = Math.min(100, verifiedSales.count * 18);
  const collectorTier = collectorPricePhp
    ? calculateCollectorTier({
        demandScore: input.demandScore,
        scarcityScore: input.scarcityScore,
        liquidityScore,
        transactionStrengthScore
      })
    : null;

  return {
    collectorPricePhp,
    collectorPriceConfidence: confidence,
    verifiedSales,
    resellerAsks,
    quickSalePricePhp: calculateQuickSalePrice(
      collectorPricePhp,
      liquidityScore >= 70 ? "HIGH" : liquidityScore >= 35 ? "MEDIUM" : "LOW"
    ),
    collectorTier,
    collectorPriceUpdatedAt: eligibleSales
      .map((sale) => new Date(sale.eventAt))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0]?.toISOString() ?? null,
    collectorPricingRuleVersion,
    excludedReasons
  };
}
