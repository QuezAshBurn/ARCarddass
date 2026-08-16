import { NextResponse } from "next/server";
import { cards } from "@/lib/data/cards";
import { getServiceSupabaseClient } from "@/lib/database/supabase";
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
      "Marketplace crawl targets are configured. eBay active raw asks ingest automatically when EBAY_BROWSE_API_TOKEN or EBAY_ACCESS_TOKEN is configured; other marketplaces require official API, partner feed, or allowed connector credentials.",
    ingestion,
    discovery
  });
}
