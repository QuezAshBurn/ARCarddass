import { NextResponse } from "next/server";
import { getMarketSummary } from "@/lib/data/cards";

export function GET() {
  return NextResponse.json(getMarketSummary());
}
