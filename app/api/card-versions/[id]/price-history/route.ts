import { NextResponse } from "next/server";
import { cards } from "@/lib/data/cards";

type RouteContext = {
  params: {
    id: string;
  };
};

export function GET(_request: Request, { params }: RouteContext) {
  const card = cards.find((item) =>
    item.versions.some((version) => version.id === params.id)
  );

  if (!card) {
    return NextResponse.json({ error: "Card version not found." }, { status: 404 });
  }

  return NextResponse.json({ history: card.priceHistory });
}
