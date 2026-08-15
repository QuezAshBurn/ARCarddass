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
    cardNumber: url.searchParams.get("cardNumber"),
    version: url.searchParams.get("version"),
    since: url.searchParams.get("since"),
    from: url.searchParams.get("from"),
    until: url.searchParams.get("until"),
    to: url.searchParams.get("to"),
    marketplace: url.searchParams.get("marketplace"),
    platform: url.searchParams.get("platform"),
    eventType: url.searchParams.get("eventType"),
    evidenceType: url.searchParams.get("evidenceType"),
    validationStatus: url.searchParams.get("validationStatus"),
    status: url.searchParams.get("status")
  };

  const cardFilter = filters.cardNumber ?? filters.card;
  const sinceFilter = filters.from ?? filters.since;
  const untilFilter = filters.to ?? filters.until;
  const marketplaceFilter = filters.platform ?? filters.marketplace;
  const eventTypeFilter = filters.evidenceType ?? filters.eventType;
  const statusFilter = filters.status ?? filters.validationStatus;

  if (cardFilter) query = query.eq("card_code", cardFilter);
  if (filters.version) query = query.eq("version", filters.version.toUpperCase());
  if (sinceFilter) query = query.gte("event_at", sinceFilter);
  if (untilFilter) query = query.lte("event_at", untilFilter);
  if (marketplaceFilter) query = query.eq("marketplace", marketplaceFilter);
  if (eventTypeFilter) query = query.eq("event_type", eventTypeFilter);
  if (statusFilter) query = query.eq("validation_status", statusFilter);

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
