import { describe, expect, it } from "vitest";
import {
  buildDuplicateFingerprint,
  calculateEngagementDelta,
  getConditionComparability,
  isMaterialEventForPricing,
  normalizeMarketEvent
} from "@/lib/domain/market-events";
import { hasSignalExpired } from "@/lib/domain/market-rules";

const baseEvent = {
  cardCode: "F01-01",
  version: "JP",
  marketplace: "Partner Feed",
  sourceUrl: "https://example.com/listing/123",
  eventType: "VERIFIED_SALE",
  eventAt: "2026-08-15T00:00:00.000Z",
  currency: "PHP",
  phpAmount: 100000,
  salePrice: 100000,
  condition: "NEAR_MINT",
  sellerConfidence: 95,
  versionConfidence: 95,
  comparabilityConfidence: 95,
  evidenceConfidence: 95
} as const;

describe("market event normalization", () => {
  it("creates stable duplicate fingerprints", () => {
    const first = buildDuplicateFingerprint({
      ...baseEvent,
      marketplaceListingId: "LISTING-1"
    });
    const second = buildDuplicateFingerprint({
      ...baseEvent,
      marketplace: " partner feed ",
      marketplaceListingId: "listing-1"
    });

    expect(first).toBe(second);
  });

  it("accepts high-confidence verified sales as material", () => {
    const event = normalizeMarketEvent(baseEvent, 100000, new Date("2026-08-15T00:05:00.000Z"));

    expect(event.validationStatus).toBe("ACCEPTED");
    expect(event.isMaterialForPricing).toBe(true);
  });

  it("does not treat a reserved listing as a verified sale", () => {
    const event = normalizeMarketEvent({
      ...baseEvent,
      eventType: "LISTING_RESERVED",
      salePrice: null
    });

    expect(event.validationStatus).toBe("DISCOUNTED");
    expect(event.isMaterialForPricing).toBe(false);
  });

  it("holds large outliers for review instead of resetting price", () => {
    const event = normalizeMarketEvent(
      {
        ...baseEvent,
        salePrice: 300000,
        phpAmount: 300000
      },
      100000
    );

    expect(event.validationStatus).toBe("REVIEW_REQUIRED");
    expect(event.isMaterialForPricing).toBe(false);
  });
});

describe("engagement and signal windows", () => {
  it("uses engagement deltas, not cumulative totals", () => {
    expect(calculateEngagementDelta(20, 25)).toBe(5);
    expect(calculateEngagementDelta(25, 25)).toBe(0);
  });

  it("expires watcher and cart signals on their own windows", () => {
    const now = new Date("2026-08-15T00:00:00.000Z");

    expect(hasSignalExpired("watcherEffect", new Date("2026-08-07T23:59:59.000Z"), now)).toBe(true);
    expect(hasSignalExpired("cartEffect", new Date("2026-08-11T23:59:59.000Z"), now)).toBe(true);
    expect(hasSignalExpired("searchDemand", new Date("2026-08-08T12:00:00.000Z"), now)).toBe(false);
  });

  it("discounts played or damaged cards through comparability", () => {
    expect(getConditionComparability("NEAR_MINT")).toBe(1);
    expect(getConditionComparability("DAMAGED")).toBeLessThan(0.2);
  });

  it("does not let stale accepted events move pricing", () => {
    expect(
      isMaterialEventForPricing({
        eventType: "WATCHER_DELTA",
        eventAt: "2026-01-01T00:00:00.000Z",
        validationStatus: "ACCEPTED"
      })
    ).toBe(false);
  });
});
