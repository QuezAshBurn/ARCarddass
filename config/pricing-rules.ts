import marketRules from "@/config/market-rules.json";

export const methodologyVersion = marketRules.pricingRuleVersion;

export const gradeMultipliers = {
  PSA: {
    "8": 0.9,
    "9": 1.4,
    "10": 6
  },
  BGS: {
    "8.5": 0.95,
    "9": 1.25,
    "9.5": 2.25,
    "10 Pristine": 6.5
  },
  CGC: {
    "8": 0.85,
    "9": 1,
    "9.5": 1.75,
    "10 Gem Mint": 3.25,
    "10 Pristine": 5
  },
  ARS: {
    "9": 1.2,
    "10": 3.5,
    "10+": 5
  }
} as const;

export const conditionNmMultipliers = {
  near_mint_or_better: 1,
  light_damage_or_minor_wear: 1.3,
  moderate_damage: 1.45,
  heavy_but_collectible_damage: 1.6,
  unclear_damage: 1.3
} as const;

export const versionRelationships = {
  EN_TO_JP: 1 / 0.9,
  HK_TO_JP: 1 / 0.85,
  JP_TO_EN: 0.9,
  JP_TO_HK: 0.85
} as const;

export const kpiWeights = {
  transaction: marketRules.legacyKpiWeights.transaction,
  buyerIntent: marketRules.legacyKpiWeights.buyerIntent,
  searchDemand: marketRules.legacyKpiWeights.searchDemand,
  scarcity: marketRules.legacyKpiWeights.scarcity,
  priceMomentum: marketRules.legacyKpiWeights.priceMomentum,
  marketBreadth: marketRules.legacyKpiWeights.marketBreadth
} as const;

export const movementCaps = {
  noVerifiedSale: marketRules.movementCaps.noVerifiedSale,
  oneIndependentVerifiedSale: marketRules.movementCaps.oneIndependentVerifiedSale,
  multipleIndependentVerifiedSales: marketRules.movementCaps.multipleIndependentVerifiedSales
} as const;

export const evidenceConfidenceGates = {
  autoAccept: 90,
  acceptModerate: 75,
  storeExclude: 50
} as const;
