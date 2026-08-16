import { describe, expect, it } from "vitest";
import { cards } from "@/lib/data/cards";
import { marketplaceSources } from "@/config/marketplace-sources";
import {
  buildMarketplaceCrawlTargets,
  getMarketplaceDiscoveryPreview
} from "@/lib/server/marketplace-crawler";

describe("marketplace crawler discovery", () => {
  it("creates one marketplace target per card and source", () => {
    const targets = buildMarketplaceCrawlTargets(cards);

    expect(targets).toHaveLength(cards.length * marketplaceSources.length);
  });

  it("generates Wanted-aware marketplace search queries", () => {
    const targets = buildMarketplaceCrawlTargets(cards);
    const luffyWantedEbay = targets.find(
      (target) => target.cardCode === "W02-02" && target.sourceCode === "ebay"
    );

    expect(luffyWantedEbay?.query).toContain("wanted");
    expect(luffyWantedEbay?.query).toContain("Monkey D. Luffy");
    expect(luffyWantedEbay?.supportedBuckets).toEqual(["ASKING", "SOLD", "FORMULA"]);
    expect(luffyWantedEbay?.searchUrl).toContain("ebay.com");
  });

  it("reports connector readiness without pretending HTML scraping is live", () => {
    const preview = getMarketplaceDiscoveryPreview(cards, new Date("2026-08-16T00:00:00.000Z"));

    expect(preview.status).toBe("READY_FOR_CONNECTORS");
    expect(preview.sourceCount).toBeGreaterThanOrEqual(7);
    expect(preview.sampleTargets.length).toBeGreaterThan(0);
    expect(preview.note).toContain("official APIs");
  });
});
