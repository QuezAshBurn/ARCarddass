import { NextResponse } from "next/server";
import { evidenceRecords } from "@/lib/data/cards";
import { getPublicSupabaseClient } from "@/lib/database/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = getPublicSupabaseClient();

  if (!supabase) {
    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      source: "static-fallback",
      events: evidenceRecords
    });
  }

  let query = supabase
    .from("market_events")
    .select(
      "id,card_code,version,marketplace,source_url,event_type,event_at,discovered_at,currency,native_amount,php_amount,listing_price,sale_price,condition,validation_status,evidence_confidence,duplicate_of,notes,created_at"
    )
    .order("event_at", { ascending: false })
    .limit(100);

  const filters = {
    card: url.searchParams.get("card"),
    version: url.searchParams.get("version"),
    since: url.searchParams.get("since"),
    until: url.searchParams.get("until"),
    marketplace: url.searchParams.get("marketplace"),
    eventType: url.searchParams.get("eventType"),
    validationStatus: url.searchParams.get("validationStatus")
  };

  if (filters.card) query = query.eq("card_code", filters.card);
  if (filters.version) query = query.eq("version", filters.version.toUpperCase());
  if (filters.since) query = query.gte("event_at", filters.since);
  if (filters.until) query = query.lte("event_at", filters.until);
  if (filters.marketplace) query = query.eq("marketplace", filters.marketplace);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.validationStatus) query = query.eq("validation_status", filters.validationStatus);

  const { data, error } = await query;

  if (error) {
    console.warn("Could not load market_events; using static evidence fallback:", error.message);

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      source: "static-fallback",
      warning: "market_events table is unavailable until migration 004 is applied.",
      events: evidenceRecords
    });
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    source: "market_events",
    filters,
    events: data ?? []
  });
}
