import { describe, expect, it } from "vitest";
import {
  adjustConditionToNearMint,
  calculateInitialReferencePrice,
  calculateMarketScore,
  calculateWeeklyMarketPrice,
  modelVersionPrices,
  reverseGradedRawValue,
  selectPublishedMarketReference,
  selectPrioritizedMarketReference,
  selectAutomaticPricingAction,
  selectHighestMarketReference
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

  it("selects the highest candidate for pure comparison views", () => {
    expect(
      selectHighestMarketReference([
        { bucket: "SOLD", label: "Latest sold comp", pricePhp: 18500 },
        { bucket: "ASKING", label: "Highest active marketplace ask", pricePhp: 22000 },
        { bucket: "FORMULA", label: "Graded-to-raw conversion", pricePhp: 19600 }
      ])
    ).toEqual({
      bucket: "ASKING",
      label: "Highest active marketplace ask",
      pricePhp: 22000
    });
  });

  it("publishes the highest raw market value before falling back to graded formulas", () => {
    expect(
      selectPublishedMarketReference([
        { bucket: "SOLD", label: "Latest sold comp", pricePhp: 18500 },
        { bucket: "ASKING", label: "Highest active raw marketplace ask", pricePhp: 22000 },
        { bucket: "FORMULA", label: "Graded-to-raw conversion", pricePhp: 42903 }
      ])
    ).toEqual({
      bucket: "ASKING",
      label: "Highest active raw marketplace ask",
      pricePhp: 22000
    });

    expect(
      selectPublishedMarketReference([
        { bucket: "FORMULA", label: "Only graded-to-raw conversion", pricePhp: 42903 }
      ])
    ).toEqual({
      bucket: "FORMULA",
      label: "Only graded-to-raw conversion",
      pricePhp: 42903
    });
  });

  it("prioritizes a recent raw sale, then a freshly observed raw ask, then graded conversion", () => {
    const now = new Date("2026-08-17T00:00:00.000Z");
    const rawAsk = {
      id: "raw-ask",
      eventType: "ACTIVE_LISTING",
      eventAt: "2026-07-01T00:00:00.000Z",
      discoveredAt: "2026-08-16T22:00:00.000Z",
      isGraded: false,
      pricePhp: 50000,
      rawEquivalentPricePhp: null
    };
    const rawSale = {
      id: "raw-sale",
      eventType: "VERIFIED_SALE",
      eventAt: "2026-08-01T00:00:00.000Z",
      discoveredAt: "2026-08-01T00:00:00.000Z",
      isGraded: false,
      pricePhp: 42000,
      rawEquivalentPricePhp: null
    };
    const graded = {
      id: "graded",
      eventType: "ACTIVE_LISTING",
      eventAt: "2026-08-15T00:00:00.000Z",
      discoveredAt: "2026-08-16T23:00:00.000Z",
      isGraded: true,
      pricePhp: 160000,
      rawEquivalentPricePhp: 64000
    };

    expect(selectPrioritizedMarketReference([rawAsk, rawSale, graded], now)).toEqual({
      eventId: "raw-sale",
      pricePhp: 42000,
      priority: "RAW_SOLD_90_DAYS"
    });
    expect(selectPrioritizedMarketReference([rawAsk, graded], now)).toEqual({
      eventId: "raw-ask",
      pricePhp: 50000,
      priority: "RAW_ACTIVE_ASK"
    });
    expect(selectPrioritizedMarketReference([graded], now)).toEqual({
      eventId: "graded",
      pricePhp: 64000,
      priority: "GRADED_TO_RAW_FALLBACK"
    });
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
