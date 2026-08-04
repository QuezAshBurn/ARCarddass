import { NextResponse } from "next/server";
import { cards } from "@/lib/data/cards";

type RouteContext = {
  params: {
    id: string;
  };
};

export function GET(_request: Request, { params }: RouteContext) {
  const version = cards.flatMap((card) => card.versions).find((item) => item.id === params.id);

  if (!version) {
    return NextResponse.json({ error: "Card version not found." }, { status: 404 });
  }

  return NextResponse.json({ pricing: version });
}
