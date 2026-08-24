import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to save a weekly draft.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});
const now = new Date();
const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

const { data: events, error } = await supabase
  .from("market_events")
  .select("id,card_code,event_type,event_at,marketplace,php_amount,validation_status,notes")
  .gte("event_at", since)
  .in("validation_status", ["ACCEPTED", "REVIEW_REQUIRED"])
  .order("event_at", { ascending: false })
  .limit(40);

if (error) {
  console.error(error.message);
  process.exit(1);
}

const meaningful = (events ?? []).filter((event) =>
  ["VERIFIED_SALE", "COMPLETED_AUCTION", "NEW_DISCOVERY", "NEW_LISTING"].includes(event.event_type) ||
  event.validation_status === "REVIEW_REQUIRED"
);

if (!meaningful.length) {
  console.log("No meaningful market events found. Weekly draft not generated.");
  process.exit(0);
}

const dateSlug = now.toISOString().slice(0, 10);
const slug = `weekly-ar-carddass-market-recap-${dateSlug}`;
const content = `## Market Summary

${meaningful.length} meaningful events were found in the latest seven-day window.

## Biggest Verified Sales

${meaningful.filter((event) => event.event_type === "VERIFIED_SALE").map((event) => `- ${event.card_code}: ${event.marketplace} ${event.php_amount ?? "amount pending"} (${event.event_at})`).join("\n") || "No accepted verified sales in this window."}

## Strongest Bid Activity

Review market event details before publishing.

## Cards With Rising Demand

Review price snapshots and demand scores before publishing.

## Cards Under Price Review

${meaningful.filter((event) => event.validation_status === "REVIEW_REQUIRED").map((event) => `- ${event.card_code}: ${event.marketplace} ${event.event_type}`).join("\n") || "No review-required events in this window."}

## New Supply

Review active ask entries before publishing.

## Version Discoveries

No version claim is made until evidence is attached.

## What to Watch Next

Add editor notes after reviewing the evidence ledger.`;

const { error: saveError } = await supabase.from("blog_posts").upsert(
  {
    slug,
    title: "Weekly AR Carddass Market Recap",
    excerpt: "Draft weekly recap generated from market events and evidence statuses.",
    content_markdown: content,
    status: "DRAFT",
    category: "Weekly Market Recap",
    author: "AR Carddass Research Desk",
    seo_title: "Weekly AR Carddass Market Recap",
    seo_description: "Draft weekly AR Carddass market recap generated from structured market events.",
    tags: ["weekly-recap", "market"],
    related_card_codes: Array.from(new Set(meaningful.map((event) => event.card_code))),
    related_set_codes: Array.from(new Set(meaningful.map((event) => event.card_code.slice(0, 3)))),
    related_evidence_ids: meaningful.map((event) => event.id),
    updated_at: now.toISOString()
  },
  { onConflict: "slug" }
);

if (saveError) {
  console.error(saveError.message);
  process.exit(1);
}

console.log(`Draft saved: ${slug}`);
