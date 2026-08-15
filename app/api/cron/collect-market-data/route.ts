import { NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/database/supabase";
import { requireCronSecret } from "@/lib/http/cron";

export async function GET(request: Request) {
  const unauthorized = requireCronSecret(request);

  if (unauthorized) {
    return unauthorized;
  }

  const supabase = getServiceSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    await supabase.from("market_source_status").upsert(
      {
        source_code: "manual-ingestion",
        status: "ONLINE",
        last_check_at: now,
        last_successful_check_at: now,
        updated_at: now,
        cursor: {}
      },
      { onConflict: "source_code" }
    );
  }

  return NextResponse.json({
    jobType: "COLLECT_MARKET_DATA",
    status: "ONLINE_PENDING_CONNECTOR",
    lastCheckAt: now,
    message:
      "Cron shell is protected. Marketplace adapters are pluggable; current production accepts evidence through the admin ingestion API."
  });
}
