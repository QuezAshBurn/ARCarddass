import { NextResponse } from "next/server";
import { getMarketSummary } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { ensureMarketPricesFresh } from "@/lib/server/market-price-cron";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  await ensureMarketPricesFresh();
  const cards = await getCardsWithLivePrices();

  return NextResponse.json(getMarketSummary(cards));
}
