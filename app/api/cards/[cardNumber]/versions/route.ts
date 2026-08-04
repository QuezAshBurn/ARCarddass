import { NextResponse } from "next/server";
import { getCardWithLivePrices } from "@/lib/data/live-cards";

type RouteContext = {
  params: {
    cardNumber: string;
  };
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  const card = await getCardWithLivePrices(params.cardNumber);

  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  return NextResponse.json({ versions: card.versions });
}
