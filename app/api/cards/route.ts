import { NextResponse } from "next/server";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

export const dynamic = "force-dynamic";

export async function GET() {
  const cards = await getCardsWithLivePrices();

  return NextResponse.json({ cards });
}
