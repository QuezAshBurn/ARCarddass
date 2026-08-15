import { z } from "zod";
import {
  conditionComparability,
  confidenceThresholds,
  hasSignalExpired,
  isConditionCategory,
  isMarketEventType,
  isValidationStatus,
  outlierThresholds,
  type ConditionCategory,
  type MarketEventType,
  type ValidationStatus
} from "@/lib/domain/market-rules";

export const marketEventInputSchema = z.object({
  cardCode: z.string().min(1),
  version: z.string().min(1).default("UNKNOWN"),
  marketplace: z.string().min(1),
  sourceUrl: z.string().url(),
  marketplaceListingId: z.string().min(1).optional().nullable(),
  marketplaceTransactionId: z.string().min(1).optional().nullable(),
  sellerId: z.string().min(1).optional().nullable(),
  sellerName: z.string().min(1).optional().nullable(),
  buyerId: z.string().min(1).optional().nullable(),
  eventType: z.string().refine(isMarketEventType, "Unsupported market event type"),
  eventAt: z.string().datetime(),
  currency: z.string().min(3).max(8),
  nativeAmount: z.number().finite().nonnegative().optional().nullable(),
  phpAmount: z.number().finite().nonnegative().optional().nullable(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxRateTimestamp: z.string().datetime().optional().nullable(),
  listingPrice: z.number().finite().nonnegative().optional().nullable(),
  salePrice: z.number().finite().nonnegative().optional().nullable(),
  condition: z.string().refine(isConditionCategory).default("UNKNOWN"),
  conditionConfidence: z.number().min(0).max(100).optional().nullable(),
  bidCount: z.number().int().nonnegative().optional().nullable(),
  watcherCount: z.number().int().nonnegative().optional().nullable(),
  cartCount: z.number().int().nonnegative().optional().nullable(),
  offerCount: z.number().int().nonnegative().optional().nullable(),
  watcherDelta: z.number().int().optional().nullable(),
  cartDelta: z.number().int().optional().nullable(),
  bidDelta: z.number().int().optional().nullable(),
  validationStatus: z.string().refine(isValidationStatus).optional(),
  sellerConfidence: z.number().min(0).max(100).optional().nullable(),
  versionConfidence: z.number().min(0).max(100).optional().nullable(),
  comparabilityConfidence: z.number().min(0).max(100).optional().nullable(),
  evidenceConfidence: z.number().min(0).max(100).optional().nullable(),
  duplicateOf: z.string().uuid().optional().nullable(),
  duplicateGroupId: z.string().min(1).optional().nullable(),
  outlierReason: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable()
});

export type MarketEventInput = z.infer<typeof marketEventInputSchema>;

export type NormalizedMarketEvent = Omit<MarketEventInput, "eventType" | "condition" | "validationStatus"> & {
  eventType: MarketEventType;
  condition: ConditionCategory;
  validationStatus: ValidationStatus;
  discoveredAt: string;
  duplicateFingerprint: string;
  isMaterialForPricing: boolean;
};

function normalizeForKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function buildDuplicateFingerprint(input: MarketEventInput) {
  return [
    normalizeForKey(input.marketplace),
    normalizeForKey(input.marketplaceListingId),
    normalizeForKey(input.marketplaceTransactionId),
    normalizeForKey(input.sourceUrl),
    normalizeForKey(input.cardCode),
    normalizeForKey(input.version),
    normalizeForKey(input.sellerId),
    normalizeForKey(input.eventType),
    new Date(input.eventAt).toISOString()
  ].join("|");
}

export function calculateEngagementDelta(previous: number | null | undefined, current: number | null | undefined) {
  if (typeof previous !== "number" || typeof current !== "number") {
    return null;
  }

  return current - previous;
}

export function getConditionComparability(condition: ConditionCategory) {
  return conditionComparability[condition];
}

export function inferValidationStatus(
  input: MarketEventInput,
  previousPublishedPricePhp?: number | null
): ValidationStatus {
  if (input.validationStatus) {
    return input.validationStatus as ValidationStatus;
  }

  if (input.eventType === "LISTING_ENDED" || input.eventType === "LISTING_RESERVED") {
    return "DISCOUNTED";
  }

  if (input.eventType === "OUTLIER_TRANSACTION") {
    return "REVIEW_REQUIRED";
  }

  const evidenceConfidence = input.evidenceConfidence ?? 50;
  const versionConfidence = input.versionConfidence ?? 50;
  const sellerConfidence = input.sellerConfidence ?? 50;
  const comparabilityConfidence = input.comparabilityConfidence ?? 50;
  const lowestConfidence = Math.min(
    evidenceConfidence,
    versionConfidence,
    sellerConfidence,
    comparabilityConfidence
  );
  const amount = input.salePrice ?? input.phpAmount ?? input.listingPrice ?? null;

  if (
    previousPublishedPricePhp &&
    amount &&
    amount >= previousPublishedPricePhp * outlierThresholds.reviewRequiredRelativeToPublished
  ) {
    return "REVIEW_REQUIRED";
  }

  if (lowestConfidence < confidenceThresholds.reviewRequiredBelow) {
    return "REVIEW_REQUIRED";
  }

  if (lowestConfidence >= confidenceThresholds.acceptModerate) {
    return "ACCEPTED";
  }

  if (lowestConfidence >= confidenceThresholds.storeExclude) {
    return "DISCOUNTED";
  }

  return "QUARANTINED";
}

export function isMaterialEventForPricing(input: Pick<MarketEventInput, "eventType" | "eventAt" | "validationStatus">) {
  const status = input.validationStatus ?? "REVIEW_REQUIRED";

  if (status !== "ACCEPTED") {
    return false;
  }

  const eventAt = new Date(input.eventAt);

  switch (input.eventType) {
    case "VERIFIED_SALE":
    case "BID_ACTIVITY":
    case "OFFER_ACTIVITY":
    case "PRICE_REDUCTION":
    case "SUPPLY_CHANGE":
    case "NEW_LISTING":
      return !hasSignalExpired("unsoldAskingPriceMomentum", eventAt);
    case "WATCHER_DELTA":
      return !hasSignalExpired("watcherEffect", eventAt);
    case "CART_DELTA":
      return !hasSignalExpired("cartEffect", eventAt);
    case "SEARCH_DEMAND_CHANGE":
      return !hasSignalExpired("searchDemand", eventAt);
    default:
      return false;
  }
}

export function normalizeMarketEvent(
  input: MarketEventInput,
  previousPublishedPricePhp?: number | null,
  discoveredAt = new Date()
): NormalizedMarketEvent {
  const parsed = marketEventInputSchema.parse(input);
  const validationStatus = inferValidationStatus(parsed, previousPublishedPricePhp);
  const normalized = {
    ...parsed,
    version: parsed.version.toUpperCase(),
    currency: parsed.currency.toUpperCase(),
    eventType: parsed.eventType as MarketEventType,
    condition: parsed.condition as ConditionCategory,
    validationStatus,
    discoveredAt: discoveredAt.toISOString(),
    duplicateFingerprint: buildDuplicateFingerprint(parsed),
    isMaterialForPricing: isMaterialEventForPricing({
      eventType: parsed.eventType,
      eventAt: parsed.eventAt,
      validationStatus
    })
  };

  return normalized;
}
