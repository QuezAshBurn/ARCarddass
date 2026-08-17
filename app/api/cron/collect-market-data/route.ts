import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/database/supabase";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { requireCronSecret } from "@/lib/http/cron";
import { ingestEbayRawAsks } from "@/lib/server/ebay-marketplace-ingestion";
import { getMarketplaceDiscoveryPreview } from "@/lib/server/marketplace-crawler";

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);

  if (unauthorized) {
    return unauthorized;
  }

  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const cards = await getCardsWithLivePrices();
  const discovery = getMarketplaceDiscoveryPreview(cards, new Date(now));
  let ingestion:
    | Awaited<ReturnType<typeof ingestEbayRawAsks>>
    | { status: "SKIPPED_NO_SUPABASE"; message: string } = {
    status: "SKIPPED_NO_SUPABASE",
    message: "Set Supabase service credentials before marketplace events can be stored."
  };

  if (supabase) {
    for (const source of discovery.sources) {
      await supabase.from("market_source_status").upsert(
        {
          source_code: source.code,
          status: source.status === "READY_WITH_CREDENTIALS" ? "PENDING_CREDENTIALS" : "TARGET_ONLY",
          last_check_at: now,
          updated_at: now,
          cursor: {
            adapter: source.adapter,
            supportedBuckets: source.supportedBuckets
          }
        },
        { onConflict: "source_code" }
      );
    }

    ingestion = await ingestEbayRawAsks({
      cards,
      supabase,
      now: new Date(now)
    });
  }

  return NextResponse.json({
    jobType: "COLLECT_MARKET_DATA",
    status: ingestion.status === "COMPLETED" ? "COMPLETED" : discovery.status,
    lastCheckAt: now,
    message:
      "The collector enumerates every catalogue card. eBay active asks ingest automatically with an official eBay token; listings without an exact catalogue-number match are stored as review-required. Mercari, Yahoo Auctions, JDirectItems, and other sources require an approved API or partner-feed connector before they can write evidence.",
    ingestion,
    discovery
  });
}
