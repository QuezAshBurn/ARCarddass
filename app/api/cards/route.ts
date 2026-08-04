import { NextResponse } from "next/server";
import { cards } from "@/lib/data/cards";

export function GET() {
  return NextResponse.json({ cards });
}
