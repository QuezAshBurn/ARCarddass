import { NextResponse } from "next/server";
import { getCardWithLivePrices } from "@/lib/data/live-cards";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type PricingRouteProps = {
  params: {
    cardNumber: string;
  };
};

export async function GET(_request: Request, { params }: PricingRouteProps) {
  const card = await getCardWithLivePrices(params.cardNumber);

  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  return NextResponse.json({
    cardNumber: card.cardNumber,
    characterName: card.characterName,
    rarity: card.rarity,
    formationSet: card.formationSet,
    versions: Object.fromEntries(
      card.versions.map((version) => [
        version.versionCode,
        {
          collectorPricePhp: version.collectorPricePhp,
          marketPricePhp: version.currentPublishedPricePhp,
          verifiedSaleRange: {
            lowPhp: version.verifiedSaleLowPhp,
            medianPhp: version.verifiedSaleMedianPhp,
            highPhp: version.verifiedSaleHighPhp,
            count: version.verifiedSaleCount
          },
          resellerAskRange: {
            lowPhp: version.resellerAskLowPhp,
            medianPhp: version.resellerAskMedianPhp,
            highPhp: version.resellerAskHighPhp,
            count: version.resellerAskCount
          },
          quickSalePricePhp: version.quickSalePricePhp,
          collectorPriceConfidence: version.collectorPriceConfidence,
          collectorTier: version.collectorTier,
          collectorPriceUpdatedAt: version.collectorPriceUpdatedAt,
          collectorPricingRuleVersion: version.collectorPricingRuleVersion
        }
      ])
    )
  });
}
