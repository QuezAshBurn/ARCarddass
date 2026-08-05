import { runMarketPriceUpdateCron } from "@/lib/server/market-price-cron";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function GET(request: Request) {
  return runMarketPriceUpdateCron(request);
}