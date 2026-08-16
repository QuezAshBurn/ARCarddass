import { NextResponse } from "next/server";
import { cards } from "@/lib/data/cards";
import { getServiceSupabaseClient } from "@/lib/database/supabase";
import { requireCronSecret } from "@/lib/http/cron";
import { getMarketplaceDiscoveryPreview } from "@/lib/server/marketplace-crawler";

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);

  if (unauthorized) {
    return unauthorized;
  }

  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();
  const discovery = getMarketplaceDiscoveryPreview(cards, new Date(now));

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
  }

  return NextResponse.json({
    jobType: "COLLECT_MARKET_DATA",
    status: discovery.status,
    lastCheckAt: now,
    message:
      "Marketplace crawl targets are configured. Enable official API, partner feed, or allowed connector credentials before extracting prices into market_events.",
    discovery
  });
}
