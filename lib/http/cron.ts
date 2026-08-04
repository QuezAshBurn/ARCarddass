import { NextResponse } from "next/server";

export function requireCronSecret(request: Request) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 }
    );
  }

  const header = request.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "");

  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  return null;
}
