export const PREMIUM_FORMATION_CARDS = [
  "F01-01",
  "F01-37",
  "F02-20",
  "F02-24",
  "F03-03",
  "F03-13",
  "F04-13",
  "F04-27"
] as const;

export type PremiumFormationCardCode = (typeof PREMIUM_FORMATION_CARDS)[number];

export type NewsletterEvent = {
  id: string;
  cardCode: string;
  cardName?: string | null;
  version?: string | null;
  marketplace?: string | null;
  sourceUrl?: string | null;
  eventType: string;
  eventAt: string;
  discoveredAt?: string | null;
  phpAmount?: number | null;
  listingPrice?: number | null;
  salePrice?: number | null;
  nativeAmount?: number | null;
  currency?: string | null;
  condition?: string | null;
  validationStatus?: string | null;
  notes?: string | null;
  duplicateFingerprint?: string | null;
  duplicateOf?: string | null;
  isGraded?: boolean | null;
  grader?: string | null;
  grade?: string | null;
  rawEquivalentPhp?: number | null;
  marketplaceListingId?: string | null;
  marketplaceTransactionId?: string | null;
};

export type NewsletterCardState = {
  cardCode: string;
  cardName: string;
  rarity: string;
  version?: string | null;
  publishedPricePhp?: number | null;
  previousPublishedPricePhp?: number | null;
  collectorConfidence?: string | null;
  marketConfidence?: string | null;
  demandScore?: number | null;
  scarcityScore?: number | null;
  lastUpdatedAt?: string | null;
};

export type NewsletterSnapshot = {
  cardCode: string;
  publishedPricePhp?: number | null;
  movementPercent?: number | null;
  createdAt?: string | null;
};

export type NewsletterDraftInput = {
  from: Date;
  to: Date;
  generatedAt: Date;
  events: NewsletterEvent[];
  historicalEvents?: NewsletterEvent[];
  states: NewsletterCardState[];
  snapshots?: NewsletterSnapshot[];
  latestSuccessfulMarketRunAt?: string | null;
};

export type NewsletterDraft = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  relatedCardCodes: string[];
  relatedSetCodes: string[];
  relatedEvidenceIds: string[];
  eventCount: number;
  historicalEventCount: number;
  reviewEventCount: number;
};

const MEANINGFUL_EVENT_TYPES = new Set([
  "VERIFIED_SALE",
  "COMPLETED_AUCTION",
  "BID_ACTIVITY",
  "OFFER_ACTIVITY",
  "WATCHER_DELTA",
  "CART_DELTA",
  "SUPPLY_CHANGE",
  "PRICE_REDUCTION",
  "VERSION_CONFIRMED",
  "PRICE_CALCULATION_MOVEMENT",
  "PRICE_DISLOCATION_REVIEW",
  "OUTLIER_TRANSACTION",
  "BUNDLE_SALE",
  "ACTIVE_LISTING",
  "NEW_LISTING"
]);

const EXCLUDED_MINOR_EVENT_TYPES = new Set([
  "LISTING_ENDED",
  "LISTING_RESERVED",
  "SEARCH_DEMAND_CHANGE"
]);

function toNumber(value: unknown): number | null {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

function formatIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatDisplayDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(value);
}

function formatDateRange(from: Date, to: Date) {
  const sameMonth = from.getUTCMonth() === to.getUTCMonth() && from.getUTCFullYear() === to.getUTCFullYear();
  const start = sameMonth
    ? new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(from)
    : formatDisplayDate(from);

  return `${start}-${new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(to)}`;
}

export function formatNewsletterPeso(value: number | null | undefined) {
  const numeric = toNumber(value);

  if (numeric === null) return "Pending";

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0
  }).format(Math.round(numeric));
}

function formatPercent(value: number | null | undefined) {
  const numeric = toNumber(value);

  if (numeric === null) return "0.00%";

  return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(2)}%`;
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function eventAmount(event: NewsletterEvent) {
  return event.salePrice ?? event.phpAmount ?? event.listingPrice ?? null;
}

function eventSortValue(event: NewsletterEvent) {
  return Math.abs(toNumber(eventAmount(event)) ?? 0);
}

function dedupeKey(event: NewsletterEvent) {
  return (
    event.duplicateFingerprint ||
    [
      event.marketplace,
      event.marketplaceListingId,
      event.marketplaceTransactionId,
      event.sourceUrl,
      event.cardCode,
      event.version,
      event.eventType,
      event.eventAt
    ]
      .map((value) => (value ?? "").toString().trim().toLowerCase())
      .join("|")
  );
}

export function dedupeNewsletterEvents(events: NewsletterEvent[]) {
  const seen = new Set<string>();

  return events.filter((event) => {
    if (event.duplicateOf) return false;

    const key = dedupeKey(event);
    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
}

export function isEventInDateWindow(event: Pick<NewsletterEvent, "eventAt">, from: Date, to: Date) {
  const eventAt = normalizeDate(event.eventAt);

  if (!eventAt) return false;

  return eventAt >= from && eventAt <= to;
}

export function isHistoricalDiscovery(event: Pick<NewsletterEvent, "eventAt" | "discoveredAt">, from: Date, to: Date) {
  const eventAt = normalizeDate(event.eventAt);
  const discoveredAt = normalizeDate(event.discoveredAt);

  if (!eventAt || !discoveredAt) return false;

  return eventAt < from && discoveredAt >= from && discoveredAt <= to;
}

export function isMeaningfulNewsletterEvent(event: NewsletterEvent) {
  if (event.duplicateOf) return false;
  if (EXCLUDED_MINOR_EVENT_TYPES.has(event.eventType)) return false;
  if (event.validationStatus === "REJECTED" || event.validationStatus === "QUARANTINED") return false;
  if (event.validationStatus === "REVIEW_REQUIRED") return true;
  if (MEANINGFUL_EVENT_TYPES.has(event.eventType)) return true;

  return false;
}

function evidenceLabel(event: NewsletterEvent, historical = false) {
  if (historical) return "Historical Evidence";
  if (event.eventType === "VERIFIED_SALE" && event.validationStatus === "ACCEPTED") return "Verified Sale";
  if (event.validationStatus === "REVIEW_REQUIRED") return "Review Required";
  if (event.eventType === "BUNDLE_SALE") return "Bundle Sale";
  if (event.eventType === "ACTIVE_LISTING" || event.eventType === "NEW_LISTING") return "Active Ask";

  return event.eventType.replaceAll("_", " ");
}

function describeEvent(event: NewsletterEvent, historical = false) {
  const parts = [
    `**${event.cardCode}**`,
    event.cardName ? `(${event.cardName})` : "",
    evidenceLabel(event, historical),
    event.marketplace ? `via ${event.marketplace}` : "",
    formatNewsletterPeso(eventAmount(event)),
    event.version ? `version ${event.version}` : "version under review",
    event.condition ? `condition ${event.condition}` : "",
    event.isGraded ? `graded ${[event.grader, event.grade].filter(Boolean).join(" ")}` : "",
    event.isGraded && event.rawEquivalentPhp ? `raw equivalent ${formatNewsletterPeso(event.rawEquivalentPhp)}` : ""
  ].filter(Boolean);

  return `- ${parts.join(" · ")}. Evidence: [${event.id}](/evidence).`;
}

function getSnapshotForCard(snapshots: NewsletterSnapshot[], cardCode: string) {
  return snapshots.find((snapshot) => snapshot.cardCode === cardCode);
}

function getMarketDirection(movementPercent: number | null | undefined) {
  const movement = toNumber(movementPercent) ?? 0;

  if (movement > 0.25) return "Up";
  if (movement < -0.25) return "Down";
  return "Flat / Held";
}

function getConfidence(state: NewsletterCardState) {
  return state.collectorConfidence || state.marketConfidence || "Under Review";
}

export function getNewsletterPersistenceAction(
  existingStatus: string | null | undefined,
  preview: boolean
): "PREVIEW_ONLY" | "INSERT_DRAFT" | "UPDATE_DRAFT" | "BLOCK_PUBLISHED" {
  if (preview) return "PREVIEW_ONLY";
  if (!existingStatus) return "INSERT_DRAFT";
  if (existingStatus === "DRAFT") return "UPDATE_DRAFT";

  return "BLOCK_PUBLISHED";
}

export function buildNewsletterDraft(input: NewsletterDraftInput): NewsletterDraft {
  const currentEvents = dedupeNewsletterEvents(input.events)
    .filter((event) => isEventInDateWindow(event, input.from, input.to))
    .filter(isMeaningfulNewsletterEvent)
    .sort((a, b) => eventSortValue(b) - eventSortValue(a));
  const historicalEvents = dedupeNewsletterEvents(input.historicalEvents ?? [])
    .filter((event) => isHistoricalDiscovery(event, input.from, input.to))
    .filter(isMeaningfulNewsletterEvent)
    .sort((a, b) => eventSortValue(b) - eventSortValue(a));
  const statesByCode = new Map(input.states.map((state) => [state.cardCode, state]));
  const relatedCardCodes = Array.from(
    new Set([...currentEvents, ...historicalEvents].map((event) => event.cardCode))
  ).filter((code) => PREMIUM_FORMATION_CARDS.includes(code as PremiumFormationCardCode));
  const relatedEvidenceIds = Array.from(new Set([...currentEvents, ...historicalEvents].map((event) => event.id)));
  const relatedSetCodes = Array.from(new Set(relatedCardCodes.map((code) => code.slice(0, 3))));
  const reviewEventCount = currentEvents.filter((event) => event.validationStatus === "REVIEW_REQUIRED").length;
  const toDate = formatIsoDate(input.to);
  const slug = `weekly-ar-carddass-market-watch-${toDate}`;
  const title = `AR Carddass Formation Market Watch - Week of ${formatDateRange(input.from, input.to)}`;
  const excerpt =
    currentEvents.length > 0
      ? `${currentEvents.length} market signals reviewed across ${relatedCardCodes.length} premium Formation cards.`
      : "No major current-period market movement was accepted; premium Formation cards remain under evidence review.";
  const cardSections = PREMIUM_FORMATION_CARDS.map((cardCode) => {
    const state = statesByCode.get(cardCode);
    const snapshot = getSnapshotForCard(input.snapshots ?? [], cardCode);
    const movement = snapshot?.movementPercent ?? null;

    return [
      `### ${cardCode} ${state?.cardName ?? "Card under review"}`,
      "",
      `- Published Price: ${formatNewsletterPeso(snapshot?.publishedPricePhp ?? state?.publishedPricePhp)}`,
      `- 7-Day Movement: ${formatPercent(movement)}`,
      `- Market Direction: ${getMarketDirection(movement)}`,
      `- Confidence: ${getConfidence(state ?? { cardCode, cardName: "Card under review", rarity: "KR" })}`,
      `- Demand / Scarcity: ${state?.demandScore ?? "Under Review"}/100 · ${state?.scarcityScore ?? "Under Review"}/100`
    ].join("\n");
  }).join("\n\n");
  const currentEventLines = currentEvents.length
    ? currentEvents.slice(0, 12).map((event) => describeEvent(event)).join("\n")
    : "No accepted or review-worthy current-period events were found in the selected window.";
  const historicalEventLines = historicalEvents.length
    ? historicalEvents.slice(0, 8).map((event) => describeEvent(event, true)).join("\n")
    : "No historical evidence was newly added in this window.";
  const reviewLines = currentEvents
    .filter((event) => event.validationStatus === "REVIEW_REQUIRED")
    .slice(0, 8)
    .map((event) => describeEvent(event))
    .join("\n");
  const evidenceLines = relatedEvidenceIds.length
    ? relatedEvidenceIds.map((id) => `- [${id}](/evidence)`).join("\n")
    : "- No evidence IDs were referenced.";
  const content = [
    "# AR Carddass Formation Market Watch",
    "",
    `## Week of ${formatDateRange(input.from, input.to)}`,
    "",
    "## Market Summary",
    "",
    excerpt,
    input.latestSuccessfulMarketRunAt
      ? `Latest successful market-processing timestamp: ${input.latestSuccessfulMarketRunAt}.`
      : "Latest successful market-processing timestamp is not available in the current data pull.",
    "",
    "Market prices are read from Supabase Market State / Price Snapshot records only. This newsletter does not calculate card prices independently.",
    "",
    cardSections,
    "",
    "## Biggest Market Events",
    "",
    currentEventLines,
    "",
    "## Historical Evidence Added This Week",
    "",
    historicalEventLines,
    "",
    "## Cards Under Review",
    "",
    reviewLines || "No review-required events were found in this selected window.",
    "",
    "## What Collectors Should Watch Next",
    "",
    "- Confirm whether review-required events are true completed sales, active asks, bundle sales, or graded references.",
    "- Watch for repeat signals across independent sellers before treating a single spike as market movement.",
    "- Keep version, condition, and grading notes visible so collectors understand why a reference was accepted or held.",
    "",
    "## Evidence",
    "",
    evidenceLines
  ].join("\n");

  return {
    slug,
    title,
    excerpt,
    content,
    tags: ["weekly-recap", "market-watch", "formation", "evidence-ledger"],
    relatedCardCodes,
    relatedSetCodes,
    relatedEvidenceIds,
    eventCount: currentEvents.length,
    historicalEventCount: historicalEvents.length,
    reviewEventCount
  };
}
