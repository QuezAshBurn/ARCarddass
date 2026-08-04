import { NextResponse } from "next/server";
import { findCard } from "@/lib/data/cards";

type RouteContext = {
  params: {
    cardNumber: string;
  };
};

export function GET(_request: Request, { params }: RouteContext) {
  const card = findCard(params.cardNumber);

  if (!card) {
    return NextResponse.json({ error: "Card not found." }, { status: 404 });
  }

  return NextResponse.json({ card });
}
