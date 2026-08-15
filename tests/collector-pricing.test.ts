import { describe, expect, it } from "vitest";
import {
  calculateCollectorPrice,
  calculateQuickSalePrice,
  calculateResellerAskRange,
  calculateVerifiedSaleRange,
  detectCollectorPriceOutlier,
  normalizeConditionPrice,
  type CollectorPricingEvidence
} from "@/lib/domain/collector-pricing";

const baseSale: CollectorPricingEvidence = {
  id: "sale-1",
  cardNumber: "F01-01",
  version: "JP",
  evidenceType: "VERIFIED_SALE",
  pricePhp: 47000,
  condition: "NEAR_MINT",
  sellerId: "seller-1",
  buyerId: "buyer-1",
  platform: "Partner Feed",
  eventAt: "2026-08-01T00:00:00.000Z",
  status: "ACCEPTED",
  conditionComparability: 1,
  independenceConfidence: 100
};

function sale(id: string, pricePhp: number, sellerId = id): CollectorPricingEvidence {
  return {
    ...baseSale,
    id,
    pricePhp,
    sellerId,
    buyerId: `buyer-${id}`
  };
}

describe("collector pricing", () => {
  it("returns insufficient data when there are no verified sales", () => {
    const result = calculateCollectorPrice({
      evidence: [],
      demandScore: 70,
      scarcityScore: 70,
      now: new Date("2026-08-15T00:00:00.000Z")
    });

    expect(result.collectorPricePhp).toBeNull();
    expect(result.collectorPriceConfidence).toBe("INSUFFICIENT_DATA");
  });

  it("uses one accepted verified sale with low confidence", () => {
    const result = calculateCollectorPrice({
      evidence: [baseSale],
      demandScore: 70,
      scarcityScore: 70,
      now: new Date("2026-08-15T00:00:00.000Z")
    });

    expect(result.collectorPricePhp).toBe(47000);
    expect(result.collectorPriceConfidence).toBe("LOW");
  });

  it("uses the median of two accepted verified sales with medium confidence", () => {
    const result = calculateCollectorPrice({
      evidence: [sale("sale-1", 45000, "seller-a"), sale("sale-2", 51000, "seller-b")],
      demandScore: 70,
      scarcityScore: 70,
      now: new Date("2026-08-15T00:00:00.000Z")
    });

    expect(result.collectorPricePhp).toBe(48000);
    expect(result.collectorPriceConfidence).toBe("MEDIUM");
  });

  it("returns high confidence for five tight independent verified sales", () => {
    const result = calculateCollectorPrice({
      evidence: [
        sale("sale-1", 45000, "seller-a"),
        sale("sale-2", 46000, "seller-b"),
        sale("sale-3", 47000, "seller-c"),
        sale("sale-4", 48000, "seller-d"),
        sale("sale-5", 49000, "seller-e")
      ],
      demandScore: 80,
      scarcityScore: 80,
      now: new Date("2026-08-15T00:00:00.000Z")
    });

    expect(result.collectorPricePhp).toBeGreaterThanOrEqual(46000);
    expect(result.collectorPricePhp).toBeLessThanOrEqual(48000);
    expect(result.collectorPriceConfidence).toBe("HIGH");
  });

  it("does not use active asks directly as Collector Price", () => {
    const result = calculateCollectorPrice({
      evidence: [
        {
          ...baseSale,
          id: "ask-1",
          evidenceType: "ACTIVE_LISTING",
          pricePhp: 200000
        }
      ],
      demandScore: 70,
      scarcityScore: 70,
      now: new Date("2026-08-15T00:00:00.000Z")
    });

    expect(result.collectorPricePhp).toBeNull();
    expect(result.resellerAsks.highPhp).toBe(200000);
  });

  it("detects extreme high and low outliers", () => {
    expect(detectCollectorPriceOutlier(150000, 100000)).toContain("above");
    expect(detectCollectorPriceOutlier(60000, 100000)).toContain("below");
  });

  it("normalizes damaged or less-comparable copies upward to NM equivalent", () => {
    expect(normalizeConditionPrice(50000, 0.5)).toBe(100000);
  });

  it("keeps duplicate transactions out of Collector Price", () => {
    const result = calculateCollectorPrice({
      evidence: [
        sale("sale-1", 45000, "seller-a"),
        { ...sale("sale-dup", 100000, "seller-a"), duplicateGroupId: "dup-1" }
      ],
      demandScore: 70,
      scarcityScore: 70,
      now: new Date("2026-08-15T00:00:00.000Z")
    });

    expect(result.collectorPricePhp).toBe(45000);
  });

  it("calculates verified sale and reseller ask ranges", () => {
    expect(calculateVerifiedSaleRange([sale("sale-1", 45000), sale("sale-2", 51000)])).toEqual({
      lowPhp: 45000,
      medianPhp: 48000,
      highPhp: 51000,
      count: 2
    });

    expect(
      calculateResellerAskRange([
        { ...baseSale, id: "ask-1", evidenceType: "ACTIVE_LISTING", pricePhp: 55000 },
        { ...baseSale, id: "ask-2", evidenceType: "ACTIVE_LISTING", pricePhp: 85000 }
      ])
    ).toEqual({
      lowPhp: 55000,
      medianPhp: 70000,
      highPhp: 85000,
      count: 2
    });
  });

  it("calculates quick-sale estimates", () => {
    expect(calculateQuickSalePrice(100000, "HIGH")).toBe(93000);
    expect(calculateQuickSalePrice(100000, "MEDIUM")).toBe(88000);
    expect(calculateQuickSalePrice(100000, "LOW")).toBe(82000);
  });

  it("does not let collector tier feed back into price", () => {
    const lowDemand = calculateCollectorPrice({
      evidence: [sale("sale-1", 47000), sale("sale-2", 49000)],
      demandScore: 10,
      scarcityScore: 10,
      now: new Date("2026-08-15T00:00:00.000Z")
    });
    const highDemand = calculateCollectorPrice({
      evidence: [sale("sale-1", 47000), sale("sale-2", 49000)],
      demandScore: 100,
      scarcityScore: 100,
      now: new Date("2026-08-15T00:00:00.000Z")
    });

    expect(lowDemand.collectorPricePhp).toBe(highDemand.collectorPricePhp);
    expect(lowDemand.collectorTier).not.toBe(highDemand.collectorTier);
  });
});
