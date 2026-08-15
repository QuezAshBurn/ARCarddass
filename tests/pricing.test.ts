import { describe, expect, it } from "vitest";
import {
  adjustConditionToNearMint,
  calculateInitialReferencePrice,
  calculateMarketScore,
  calculateWeeklyMarketPrice,
  modelVersionPrices,
  reverseGradedRawValue,
  selectAutomaticPricingAction
} from "@/lib/domain/pricing";

describe("pricing state guard", () => {
  it("routes UNINITIALIZED to initial pricing and LIVE to weekly pricing", () => {
    expect(selectAutomaticPricingAction("UNINITIALIZED")).toBe("RUN_INITIAL_PRICING");
    expect(selectAutomaticPricingAction("LIVE")).toBe("RUN_SCHEDULED_MARKET_PRICING");
  });

  it("does not automatically price initialized, frozen, or rebase-pending records", () => {
    expect(selectAutomaticPricingAction("INITIALIZED")).toBe("SKIP_AUTOMATIC_PRICING");
    expect(selectAutomaticPricingAction("FROZEN")).toBe("SKIP_AUTOMATIC_PRICING");
    expect(selectAutomaticPricingAction("REBASE_PENDING")).toBe("SKIP_AUTOMATIC_PRICING");
  });
});

describe("initial pricing", () => {
  it("selects the highest candidate", () => {
    expect(
      calculateInitialReferencePrice({
        highestCredibleRawAskPhp: 100000,
        highestVerifiedRawSalePhp: 118000,
        highestGradeImpliedRawPhp: 112000,
        highestDamageAdjustedNmPhp: 98000
      })
    ).toBe(118000);
  });

  it("reverse models Boa HK ARS 10 evidence", () => {
    expect(reverseGradedRawValue(232400, "ARS", "10")).toBe(66400);
  });

  it("uplifts damaged evidence to NM-equivalent", () => {
    expect(adjustConditionToNearMint(100000, "moderate_damage")).toBe(145000);
  });

  it("models EN and HK from a JP anchor", () => {
    expect(modelVersionPrices("JP", 100000)).toEqual({
      JP: 100000,
      EN: 90000,
      HK: 85000,
      primaryAnchor: "JP"
    });
  });
});

describe("scheduled market pricing", () => {
  it("matches the scheduled update acceptance test", () => {
    const result = calculateWeeklyMarketPrice({
      currentPublishedPricePhp: 100000,
      verifiedSaleCount: 1,
      hasFreshMaterialEvidence: true,
      hasMajorOutlier: false,
      transactionScore: 65,
      buyerIntentScore: 65,
      searchDemandScore: 65,
      scarcityScore: 65,
      priceMomentumScore: 65,
      marketBreadthScore: 65
    });

    expect(result.calculatedMovementPercent).toBeCloseTo(2.25);
    expect(result.calculatedPricePhp).toBe(102250);
  });

  it("keeps price unchanged when there is no fresh material evidence", () => {
    const result = calculateWeeklyMarketPrice({
      currentPublishedPricePhp: 100000,
      verifiedSaleCount: 0,
      hasFreshMaterialEvidence: false,
      hasMajorOutlier: false
    });

    expect(result.status).toBe("NO_EVIDENCE_NO_MOVEMENT");
    expect(result.calculatedPricePhp).toBe(100000);
  });

  it("redistributes unavailable KPI weights across available scores", () => {
    expect(
      calculateMarketScore({
        transactionScore: 80,
        scarcityScore: 60
      })
    ).toBe(74);
  });

  it("holds major outliers for review", () => {
    const result = calculateWeeklyMarketPrice({
      currentPublishedPricePhp: 100000,
      verifiedSaleCount: 2,
      hasFreshMaterialEvidence: true,
      hasMajorOutlier: true,
      transactionScore: 100
    });

    expect(result.status).toBe("HELD_FOR_REVIEW");
    expect(result.calculatedPricePhp).toBe(100000);
  });
});
