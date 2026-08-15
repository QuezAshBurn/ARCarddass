import { NextResponse } from "next/server";
import { getPublicSupabaseClient } from "@/lib/database/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  const supabase = getPublicSupabaseClient();

  if (!supabase) {
    return NextResponse.json({
      status: "OFFLINE",
      lastCheckAt: null,
      lastSuccessfulCheckAt: null,
      lastMaterialEventAt: null,
      lastPriceCalculationAt: null,
      sourceHealth: []
    });
  }

  const { data, error } = await supabase
    .from("market_source_status")
    .select(
      "source_code,status,last_check_at,last_successful_check_at,last_material_event_at,last_price_calculation_at,error_message,updated_at"
    )
    .order("source_code", { ascending: true });

  if (error) {
    return NextResponse.json({
      status: "DEGRADED",
      lastCheckAt: null,
      lastSuccessfulCheckAt: null,
      lastMaterialEventAt: null,
      lastPriceCalculationAt: null,
      sourceHealth: [],
      warning: "market_source_status is unavailable until migration 004 is applied."
    });
  }

  const rows = data ?? [];
  const status = rows.some((row) => row.status === "OFFLINE")
    ? "DEGRADED"
    : rows.length > 0
      ? "ONLINE"
      : "OFFLINE";

  return NextResponse.json({
    status,
    lastCheckAt: rows.map((row) => row.last_check_at).filter(Boolean).sort().at(-1) ?? null,
    lastSuccessfulCheckAt:
      rows.map((row) => row.last_successful_check_at).filter(Boolean).sort().at(-1) ?? null,
    lastMaterialEventAt:
      rows.map((row) => row.last_material_event_at).filter(Boolean).sort().at(-1) ?? null,
    lastPriceCalculationAt:
      rows.map((row) => row.last_price_calculation_at).filter(Boolean).sort().at(-1) ?? null,
    sourceHealth: rows
  });
}
