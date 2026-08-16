import { marketplaceSources, buildMarketplaceQuery } from "@/config/marketplace-sources";
import type { Card } from "@/lib/data/cards";
import type { MarketReferenceBucket } from "@/lib/domain/pricing";

export type MarketplaceCrawlTarget = {
  sourceCode: string;
  sourceName: string;
  cardCode: string;
  cardName: string;
  productLine: Card["productLine"];
  query: string;
  searchUrl: string;
  supportedBuckets: MarketReferenceBucket[];
  adapter: "official-api" | "partner-feed" | "search-target";
  status: "READY_WITH_CREDENTIALS" | "TARGET_ONLY";
};

export type MarketplaceDiscoveryPreview = {
  status: "READY_FOR_CONNECTORS";
  generatedAt: string;
  sourceCount: number;
  targetCount: number;
  sources: {
    code: string;
    name: string;
    adapter: MarketplaceCrawlTarget["adapter"];
    status: MarketplaceCrawlTarget["status"];
    supportedBuckets: MarketReferenceBucket[];
  }[];
  sampleTargets: MarketplaceCrawlTarget[];
  note: string;
};

function mapCoverageToBucket(coverage: string): MarketReferenceBucket | null {
  if (coverage === "SOLD") return "SOLD";
  if (coverage === "ASKING") return "ASKING";
  if (coverage === "FORMULA_INPUT") return "FORMULA";

  return null;
}

export function buildMarketplaceCrawlTargets(cards: Card[]): MarketplaceCrawlTarget[] {
  return cards.flatMap((card) => {
    const query = buildMarketplaceQuery({
      productLine: card.productLine,
      cardNumber: card.cardNumber,
      characterName: card.characterName,
      printedNumber: card.printedNumber
    });

    return marketplaceSources.map((source) => ({
      sourceCode: source.code,
      sourceName: source.name,
      cardCode: card.cardNumber,
      cardName: card.characterName,
      productLine: card.productLine,
      query,
      searchUrl: source.buildSearchUrl(query),
      supportedBuckets: source.coverage
        .map(mapCoverageToBucket)
        .filter((bucket): bucket is MarketReferenceBucket => bucket !== null),
      adapter: source.adapter,
      status: source.status
    }));
  });
}

export function getMarketplaceDiscoveryPreview(cards: Card[], now = new Date()): MarketplaceDiscoveryPreview {
  const targets = buildMarketplaceCrawlTargets(cards);

  return {
    status: "READY_FOR_CONNECTORS",
    generatedAt: now.toISOString(),
    sourceCount: marketplaceSources.length,
    targetCount: targets.length,
    sources: marketplaceSources.map((source) => ({
      code: source.code,
      name: source.name,
      adapter: source.adapter,
      status: source.status,
      supportedBuckets: source.coverage
        .map(mapCoverageToBucket)
        .filter((bucket): bucket is MarketReferenceBucket => bucket !== null)
    })),
    sampleTargets: targets.slice(0, 12),
    note:
      "This generates compliant marketplace discovery targets. Price extraction should use official APIs, partner feeds, or allowed connector credentials before writing market_events."
  };
}
