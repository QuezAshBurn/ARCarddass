export const methodologyVersion = "2026.08.04";

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
  CN_TO_JP: 1 / 0.85,
  JP_TO_EN: 0.9,
  JP_TO_CN: 0.85
} as const;

export const kpiWeights = {
  transaction: 0.35,
  buyerIntent: 0.2,
  searchDemand: 0.15,
  scarcity: 0.15,
  priceMomentum: 0.1,
  marketBreadth: 0.05
} as const;

export const movementCaps = {
  noVerifiedSale: 0.015,
  oneIndependentVerifiedSale: 0.075,
  multipleIndependentVerifiedSales: 0.12
} as const;

export const evidenceConfidenceGates = {
  autoAccept: 90,
  acceptModerate: 75,
  storeExclude: 50
} as const;
