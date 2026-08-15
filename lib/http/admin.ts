import { NextResponse } from "next/server";

export function requireAdminMarketSecret(request: Request) {
  const expected =
    process.env.MARKET_EVENT_INGEST_SECRET ??
    process.env.ADMIN_MARKET_EVENT_SECRET ??
    process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "MARKET_EVENT_INGEST_SECRET is not configured." },
      { status: 500 }
    );
  }

  const header = request.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "");

  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized market event request." }, { status: 401 });
  }

  return null;
}
