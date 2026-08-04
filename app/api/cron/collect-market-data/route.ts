import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/http/cron";

export function GET(request: Request) {
  const unauthorized = requireCronSecret(request);

  if (unauthorized) {
    return unauthorized;
  }

  return NextResponse.json({
    jobType: "COLLECT_MARKET_DATA",
    status: "PENDING_CONNECTOR",
    message:
      "Cron shell is protected. Add authorized marketplace connectors before enabling collection."
  });
}
