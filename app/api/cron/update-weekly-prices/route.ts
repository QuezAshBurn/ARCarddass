import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/http/cron";

export function GET(request: Request) {
  const unauthorized = requireCronSecret(request);

  if (unauthorized) {
    return unauthorized;
  }

  return NextResponse.json({
    jobType: "WEEKLY_PRICE_UPDATE",
    status: "PENDING_DATABASE",
    message:
      "Weekly pricing route is protected. Wire to LIVE card versions and unprocessed KPI events."
  });
}
