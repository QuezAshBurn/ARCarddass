import { createClient } from "@supabase/supabase-js";
import {
  buildNewsletterDraft,
  getNewsletterPersistenceAction,
  PREMIUM_FORMATION_CARDS,
  type NewsletterCardState,
  type NewsletterEvent,
  type NewsletterSnapshot
} from "../lib/domain/market-newsletter.ts";

type CliOptions = {
  from: Date;
  to: Date;
  days: number;
  preview: boolean;
};

type CardVersionRow = {
  id: string;
  version_code: string;
  current_published_price_php: number | string | null;
  cards:
    | {
        card_number: string;
        character_name: string;
        product_line: string | null;
      }
    | {
        card_number: string;
        character_name: string;
        product_line: string | null;
      }[]
    | null;
};

type MarketStateRow = {
  card_code: string;
  card_name: string | null;
  rarity: string | null;
  version: string | null;
  published_price_php: number | string | null;
  previous_published_price_php: number | string | null;
  collector_price_confidence: string | null;
  confidence: string | null;
  demand_score: number | null;
  scarcity_score: number | null;
  last_published_at: string | null;
  updated_at: string | null;
};

type MarketEventRow = {
  id: string;
  card_code: string;
  version: string | null;
  marketplace: string | null;
  source_url: string | null;
  marketplace_listing_id: string | null;
  marketplace_transaction_id: string | null;
  event_type: string;
  event_at: string;
  discovered_at: string | null;
  currency: string | null;
  native_amount: number | string | null;
  php_amount: number | string | null;
  listing_price: number | string | null;
  sale_price: number | string | null;
  condition: string | null;
  validation_status: string | null;
  duplicate_fingerprint: string | null;
  duplicate_of: string | null;
  notes: string | null;
  is_graded: boolean | null;
  grader: string | null;
  grade: string | null;
  raw_equivalent_php: number | string | null;
};

type PriceSnapshotRow = {
  card_version_id: string;
  published_price_php: number | string | null;
  calculated_movement_percent: number | string | null;
  created_at: string | null;
};

type BlogPostRow = {
  id: string;
  slug: string;
  status: string;
};

function parseDateOnly(value: string, endOfDay = false) {
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
}

function parseArgs(argv: string[], now = new Date()): CliOptions {
  const args = new Map<string, string | boolean>();

  for (const arg of argv) {
    if (arg === "--preview") {
      args.set("preview", true);
      continue;
    }

    const [key, value] = arg.split("=");
    if (key.startsWith("--") && value) {
      args.set(key.slice(2), value);
    }
  }

  const days = Number(args.get("days") ?? 7);
  const explicitFrom = args.get("from");
  const explicitTo = args.get("to");
  const to = typeof explicitTo === "string" ? parseDateOnly(explicitTo, true) : now;
  const from =
    typeof explicitFrom === "string"
      ? parseDateOnly(explicitFrom)
      : new Date(to.getTime() - Math.max(1, days) * 24 * 60 * 60 * 1000);

  return {
    from,
    to,
    days: Number.isFinite(days) ? Math.max(1, days) : 7,
    preview: args.get("preview") === true
  };
}

function numeric(value: number | string | null | undefined) {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function singleRelation<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function toNewsletterEvent(row: MarketEventRow, cardNames: Map<string, string>): NewsletterEvent {
  return {
    id: row.id,
    cardCode: row.card_code,
    cardName: cardNames.get(row.card_code) ?? null,
    version: row.version,
    marketplace: row.marketplace,
    sourceUrl: row.source_url,
    marketplaceListingId: row.marketplace_listing_id,
    marketplaceTransactionId: row.marketplace_transaction_id,
    eventType: row.event_type,
    eventAt: row.event_at,
    discoveredAt: row.discovered_at,
    phpAmount: numeric(row.php_amount),
    listingPrice: numeric(row.listing_price),
    salePrice: numeric(row.sale_price),
    nativeAmount: numeric(row.native_amount),
    currency: row.currency,
    condition: row.condition,
    validationStatus: row.validation_status,
    notes: row.notes,
    duplicateFingerprint: row.duplicate_fingerprint,
    duplicateOf: row.duplicate_of,
    isGraded: row.is_graded,
    grader: row.grader,
    grade: row.grade,
    rawEquivalentPhp: numeric(row.raw_equivalent_php)
  };
}

function mapState(row: MarketStateRow): NewsletterCardState {
  return {
    cardCode: row.card_code,
    cardName: row.card_name ?? row.card_code,
    rarity: row.rarity ?? "KR",
    version: row.version,
    publishedPricePhp: numeric(row.published_price_php),
    previousPublishedPricePhp: numeric(row.previous_published_price_php),
    collectorConfidence: row.collector_price_confidence,
    marketConfidence: row.confidence,
    demandScore: row.demand_score,
    scarcityScore: row.scarcity_score,
    lastUpdatedAt: row.last_published_at ?? row.updated_at
  };
}

function mapSnapshot(row: PriceSnapshotRow, versionToCardCode: Map<string, string>): NewsletterSnapshot | null {
  const cardCode = versionToCardCode.get(row.card_version_id);

  if (!cardCode) return null;

  return {
    cardCode,
    publishedPricePhp: numeric(row.published_price_php),
    movementPercent: numeric(row.calculated_movement_percent),
    createdAt: row.created_at
  };
}

const eventSelect = [
  "id",
  "card_code",
  "version",
  "marketplace",
  "source_url",
  "marketplace_listing_id",
  "marketplace_transaction_id",
  "event_type",
  "event_at",
  "discovered_at",
  "currency",
  "native_amount",
  "php_amount",
  "listing_price",
  "sale_price",
  "condition",
  "validation_status",
  "duplicate_fingerprint",
  "duplicate_of",
  "notes",
  "is_graded",
  "grader",
  "grade",
  "raw_equivalent_php"
].join(",");

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });

  const { data: versionRows, error: versionError } = await supabase
    .from("card_versions")
    .select("id,version_code,current_published_price_php,cards(card_number,character_name,product_line)")
    .eq("version_code", "JP");

  if (versionError) throw new Error(versionError.message);

  const versionToCardCode = new Map<string, string>();
  const cardNames = new Map<string, string>();

  for (const row of (versionRows ?? []) as CardVersionRow[]) {
    const card = singleRelation(row.cards);

    if (!card || card.product_line !== "Formation") continue;
    if (!PREMIUM_FORMATION_CARDS.includes(card.card_number as never)) continue;

    versionToCardCode.set(row.id, card.card_number);
    cardNames.set(card.card_number, card.character_name);
  }

  const { data: stateRows, error: stateError } = await supabase
    .from("market_states")
    .select(
      "card_code,card_name,rarity,version,published_price_php,previous_published_price_php,collector_price_confidence,confidence,demand_score,scarcity_score,last_published_at,updated_at"
    )
    .eq("product_line", "Formation")
    .eq("version", "JP")
    .in("card_code", [...PREMIUM_FORMATION_CARDS]);

  if (stateError) throw new Error(stateError.message);

  const { data: currentEventRows, error: currentEventError } = await supabase
    .from("market_events")
    .select(eventSelect)
    .gte("event_at", options.from.toISOString())
    .lte("event_at", options.to.toISOString())
    .in("card_code", [...PREMIUM_FORMATION_CARDS])
    .in("validation_status", ["ACCEPTED", "REVIEW_REQUIRED", "DISCOUNTED"])
    .order("event_at", { ascending: false })
    .limit(250);

  if (currentEventError) throw new Error(currentEventError.message);

  const { data: historicalEventRows, error: historicalEventError } = await supabase
    .from("market_events")
    .select(eventSelect)
    .lt("event_at", options.from.toISOString())
    .gte("discovered_at", options.from.toISOString())
    .lte("discovered_at", options.to.toISOString())
    .in("card_code", [...PREMIUM_FORMATION_CARDS])
    .in("validation_status", ["ACCEPTED", "REVIEW_REQUIRED", "DISCOUNTED"])
    .order("discovered_at", { ascending: false })
    .limit(120);

  if (historicalEventError) throw new Error(historicalEventError.message);

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from("price_snapshots")
    .select("card_version_id,published_price_php,calculated_movement_percent,created_at")
    .in("card_version_id", [...versionToCardCode.keys()])
    .order("created_at", { ascending: false })
    .limit(80);

  if (snapshotError) throw new Error(snapshotError.message);

  const latestSnapshots = new Map<string, NewsletterSnapshot>();

  for (const row of (snapshotRows ?? []) as PriceSnapshotRow[]) {
    const snapshot = mapSnapshot(row, versionToCardCode);

    if (snapshot && !latestSnapshots.has(snapshot.cardCode)) {
      latestSnapshots.set(snapshot.cardCode, snapshot);
    }
  }

  const latestSuccessfulMarketRunAt =
    [...latestSnapshots.values()]
      .map((snapshot) => snapshot.createdAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
  const draft = buildNewsletterDraft({
    from: options.from,
    to: options.to,
    generatedAt: new Date(),
    events: ((currentEventRows ?? []) as unknown as MarketEventRow[]).map((row) => toNewsletterEvent(row, cardNames)),
    historicalEvents: ((historicalEventRows ?? []) as unknown as MarketEventRow[]).map((row) => toNewsletterEvent(row, cardNames)),
    states: ((stateRows ?? []) as MarketStateRow[]).map(mapState),
    snapshots: [...latestSnapshots.values()],
    latestSuccessfulMarketRunAt
  });

  if (options.preview) {
    console.log(draft.content);
    console.log(
      JSON.stringify(
        {
          slug: draft.slug,
          eventCount: draft.eventCount,
          historicalEventCount: draft.historicalEventCount,
          reviewEventCount: draft.reviewEventCount,
          relatedCardCodes: draft.relatedCardCodes,
          relatedEvidenceIds: draft.relatedEvidenceIds
        },
        null,
        2
      )
    );
    return;
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("blog_posts")
    .select("id,slug,status")
    .eq("slug", draft.slug)
    .limit(1);

  if (existingError) throw new Error(existingError.message);

  const existing = ((existingRows ?? []) as BlogPostRow[])[0];
  const action = getNewsletterPersistenceAction(existing?.status, false);

  if (action === "BLOCK_PUBLISHED") {
    throw new Error(`Newsletter ${draft.slug} already exists as ${existing.status}; refusing to overwrite it.`);
  }

  const payload = {
    slug: draft.slug,
    title: draft.title,
    excerpt: draft.excerpt,
    content_markdown: draft.content,
    status: "DRAFT",
    category: "Weekly Market Recap",
    author: "AR Carddass Research Desk",
    seo_title: draft.title,
    seo_description: draft.excerpt,
    tags: draft.tags,
    related_card_codes: draft.relatedCardCodes,
    related_set_codes: draft.relatedSetCodes,
    related_evidence_ids: draft.relatedEvidenceIds,
    updated_at: new Date().toISOString()
  };

  const response =
    action === "UPDATE_DRAFT"
      ? await supabase.from("blog_posts").update(payload).eq("id", existing.id)
      : await supabase.from("blog_posts").insert(payload);

  if (response.error) throw new Error(response.error.message);

  console.log(`${action === "UPDATE_DRAFT" ? "Draft updated" : "Draft created"}: ${draft.slug}`);
  console.log(
    `Events: ${draft.eventCount} current, ${draft.historicalEventCount} historical, ${draft.reviewEventCount} review-required.`
  );
  console.log(`Cards: ${draft.relatedCardCodes.join(", ") || "none"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
