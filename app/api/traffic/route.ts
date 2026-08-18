import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/database/supabase";

export const dynamic = "force-dynamic";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getHeaderLocation(request: NextRequest, headerName: string) {
  const value = request.headers.get(headerName)?.trim();
  return value && value.length <= 120 ? value : null;
}

function hasSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (request.headers.get("dnt") === "1" || !hasSameOrigin(request)) {
    return new NextResponse(null, { status: 204 });
  }

  const payload = (await request.json().catch(() => null)) as { path?: unknown } | null;
  const path = typeof payload?.path === "string" ? payload.path.trim() : "";

  if (!path.startsWith("/") || path.length > 240) {
    return new NextResponse(null, { status: 204 });
  }

  const existingVisitorId = request.cookies.get("ar_visitor_id")?.value;
  const visitorId = existingVisitorId && uuidPattern.test(existingVisitorId)
    ? existingVisitorId
    : crypto.randomUUID();
  const response = new NextResponse(null, { status: 204 });

  if (visitorId !== existingVisitorId) {
    response.cookies.set("ar_visitor_id", visitorId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/"
    });
  }

  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return response;
  }

  const { error } = await supabase.from("traffic_visits").insert({
    visitor_id: visitorId,
    path,
    country: getHeaderLocation(request, "x-vercel-ip-country") ?? getHeaderLocation(request, "cf-ipcountry"),
    region: getHeaderLocation(request, "x-vercel-ip-country-region"),
    city: getHeaderLocation(request, "x-vercel-ip-city")
  });

  if (error) {
    console.warn("Could not record traffic visit:", error.message);
  }

  return response;
}
