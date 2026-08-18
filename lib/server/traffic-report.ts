import { getServiceSupabaseClient } from "@/lib/database/supabase";

type TrafficVisitRow = {
  occurred_at: string;
  visitor_id: string;
  path: string;
  country: string | null;
  region: string | null;
  city: string | null;
};

export type TrafficReportFilters = {
  from: string;
  to: string;
  country: string;
};

type TrafficBucket = {
  label: string;
  visits: number;
  visitors: number;
};

export type TrafficReport = {
  error: string | null;
  filters: TrafficReportFilters;
  totalVisits: number;
  uniqueVisitors: number;
  daily: TrafficBucket[];
  locations: TrafficBucket[];
  pages: TrafficBucket[];
  countries: string[];
};

const defaultReport = (filters: TrafficReportFilters, error: string | null = null): TrafficReport => ({
  error,
  filters,
  totalVisits: 0,
  uniqueVisitors: 0,
  daily: [],
  locations: [],
  pages: [],
  countries: []
});

function normaliseDate(value: string | undefined, fallback: Date) {
  const candidate = value?.trim();

  if (candidate && /^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    return candidate;
  }

  return fallback.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export function getTrafficFilters(input: Record<string, string | string[] | undefined>): TrafficReportFilters {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  const from = normaliseDate(typeof input.from === "string" ? input.from : undefined, thirtyDaysAgo);
  const to = normaliseDate(typeof input.to === "string" ? input.to : undefined, today);

  return {
    from: from <= to ? from : to,
    to: from <= to ? to : from,
    country: typeof input.country === "string" ? input.country.slice(0, 120) : ""
  };
}

function startOfPhilippineDay(date: string) {
  return new Date(`${date}T00:00:00.000+08:00`).toISOString();
}

function endOfPhilippineDay(date: string) {
  return new Date(`${date}T23:59:59.999+08:00`).toISOString();
}

function toTrafficBuckets(items: Map<string, Set<string> | { visits: number; visitors: Set<string> }>) {
  return [...items.entries()]
    .map(([label, value]) => {
      const bucket = value instanceof Set ? { visits: value.size, visitors: value } : value;
      return { label, visits: bucket.visits, visitors: bucket.visitors.size };
    })
    .sort((left, right) => right.visits - left.visits || left.label.localeCompare(right.label));
}

function addBucket(bucket: Map<string, { visits: number; visitors: Set<string> }>, label: string, visitorId: string) {
  const value = bucket.get(label) ?? { visits: 0, visitors: new Set<string>() };
  value.visits += 1;
  value.visitors.add(visitorId);
  bucket.set(label, value);
}

function formatLocation(row: TrafficVisitRow) {
  return [row.city, row.region, row.country].filter(Boolean).join(", ") || "Unknown location";
}

function philippineDay(occurredAt: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(occurredAt));
}

export async function getTrafficReport(filters: TrafficReportFilters): Promise<TrafficReport> {
  const supabase = getServiceSupabaseClient();

  if (!supabase) {
    return defaultReport(filters, "Supabase service credentials are not configured in Vercel.");
  }

  let query = supabase
    .from("traffic_visits")
    .select("occurred_at,visitor_id,path,country,region,city")
    .gte("occurred_at", startOfPhilippineDay(filters.from))
    .lte("occurred_at", endOfPhilippineDay(filters.to))
    .order("occurred_at", { ascending: false })
    .limit(10000);

  if (filters.country) {
    query = query.eq("country", filters.country);
  }

  const { data, error } = await query;

  if (error) {
    return defaultReport(filters, error.message);
  }

  const rows = (data ?? []) as TrafficVisitRow[];
  const visitors = new Set<string>();
  const daily = new Map<string, { visits: number; visitors: Set<string> }>();
  const locations = new Map<string, { visits: number; visitors: Set<string> }>();
  const pages = new Map<string, { visits: number; visitors: Set<string> }>();
  const countries = new Set<string>();

  for (const row of rows) {
    visitors.add(row.visitor_id);
    addBucket(daily, philippineDay(row.occurred_at), row.visitor_id);
    addBucket(locations, formatLocation(row), row.visitor_id);
    addBucket(pages, row.path, row.visitor_id);

    if (row.country) {
      countries.add(row.country);
    }
  }

  return {
    error: null,
    filters,
    totalVisits: rows.length,
    uniqueVisitors: visitors.size,
    daily: toTrafficBuckets(daily).sort((left, right) => left.label.localeCompare(right.label)),
    locations: toTrafficBuckets(locations).slice(0, 20),
    pages: toTrafficBuckets(pages).slice(0, 12),
    countries: [...countries].sort()
  };
}
