import marketRules from "@/config/market-rules.json";

export type MarketEventType =
  | "VERIFIED_SALE"
  | "ACTIVE_LISTING"
  | "NEW_LISTING"
  | "PRICE_REDUCTION"
  | "BID_ACTIVITY"
  | "WATCHER_DELTA"
  | "CART_DELTA"
  | "OFFER_ACTIVITY"
  | "SUPPLY_CHANGE"
  | "LISTING_ENDED"
  | "LISTING_RESERVED"
  | "VERSION_CONFIRMED"
  | "OUTLIER_TRANSACTION"
  | "SEARCH_DEMAND_CHANGE";

export type ValidationStatus =
  | "ACCEPTED"
  | "DISCOUNTED"
  | "QUARANTINED"
  | "REVIEW_REQUIRED"
  | "REJECTED";

export type ConditionCategory =
  | "MINT"
  | "NEAR_MINT"
  | "LIGHT_PLAY"
  | "MODERATE_PLAY"
  | "HEAVY_PLAY"
  | "DAMAGED"
  | "UNKNOWN";

export const pricingRuleVersion = marketRules.pricingRuleVersion;
export const signalWindowsDays = marketRules.signalWindowsDays;
export const marketEventTypes = marketRules.eventTypes as readonly MarketEventType[];
export const validationStatuses = marketRules.validationStatuses as readonly ValidationStatus[];
export const conditionCategories = marketRules.conditionCategories as readonly ConditionCategory[];
export const conditionComparability = marketRules.conditionComparability;
export const versionComparability = marketRules.versionComparability;
export const autonomousKpiWeights = marketRules.kpiWeights;
export const outlierThresholds = marketRules.outlierThresholds;
export const confidenceThresholds = marketRules.confidenceThresholds;

export function isMarketEventType(value: string): value is MarketEventType {
  return marketEventTypes.includes(value as MarketEventType);
}

export function isValidationStatus(value: string): value is ValidationStatus {
  return validationStatuses.includes(value as ValidationStatus);
}

export function isConditionCategory(value: string): value is ConditionCategory {
  return conditionCategories.includes(value as ConditionCategory);
}

export function getSignalWindowDays(signal: keyof typeof signalWindowsDays) {
  return signalWindowsDays[signal];
}

export function hasSignalExpired(
  signal: keyof typeof signalWindowsDays,
  eventAt: Date,
  now = new Date()
) {
  const maxAgeMs = signalWindowsDays[signal] * 24 * 60 * 60 * 1000;

  return now.getTime() - eventAt.getTime() > maxAgeMs;
}
