import { describe, expect, it } from "vitest";
import {
  buildNewsletterDraft,
  dedupeNewsletterEvents,
  getNewsletterPersistenceAction,
  isHistoricalDiscovery,
  isMeaningfulNewsletterEvent,
  type NewsletterCardState,
  type NewsletterEvent
} from "@/lib/domain/market-newsletter";

const from = new Date("2026-08-17T00:00:00.000Z");
const to = new Date("2026-08-24T23:59:59.999Z");

function event(overrides: Partial<NewsletterEvent> = {}): NewsletterEvent {
  return {
    id: overrides.id ?? "evt-1",
    cardCode: overrides.cardCode ?? "F03-03",
    cardName: overrides.cardName ?? "Roronoa Zoro",
    version: overrides.version ?? "JP",
    marketplace: overrides.marketplace ?? "eBay",
    sourceUrl: overrides.sourceUrl ?? "https://example.com/evidence",
    eventType: overrides.eventType ?? "VERIFIED_SALE",
    eventAt: overrides.eventAt ?? "2026-08-20T12:00:00.000Z",
    discoveredAt: overrides.discoveredAt ?? "2026-08-20T13:00:00.000Z",
    phpAmount: overrides.phpAmount ?? 184347,
    condition: overrides.condition ?? "NEAR_MINT",
    validationStatus: overrides.validationStatus ?? "ACCEPTED",
    duplicateFingerprint: overrides.duplicateFingerprint,
    duplicateOf: overrides.duplicateOf,
    isGraded: overrides.isGraded,
    grader: overrides.grader,
    grade: overrides.grade,
    rawEquivalentPhp: overrides.rawEquivalentPhp,
    notes: overrides.notes
  };
}

const states: NewsletterCardState[] = [
  {
    cardCode: "F01-01",
    cardName: "Monkey D. Luffy",
    rarity: "KR",
    publishedPricePhp: 194000,
    collectorConfidence: "LOW",
    demandScore: 72,
    scarcityScore: 75
  },
  {
    cardCode: "F03-03",
    cardName: "Roronoa Zoro",
    rarity: "KR",
    publishedPricePhp: 150000,
    collectorConfidence: "HIGH",
    demandScore: 80,
    scarcityScore: 75
  }
];

describe("market newsletter generation", () => {
  it("uses eventAt for the newsletter window and treats older eventAt records as historical discoveries", () => {
    const historical = event({
      id: "hist-1",
      eventAt: "2026-06-01T12:00:00.000Z",
      discoveredAt: "2026-08-19T12:00:00.000Z"
    });

    expect(isHistoricalDiscovery(historical, from, to)).toBe(true);

    const draft = buildNewsletterDraft({
      from,
      to,
      generatedAt: to,
      events: [event({ id: "current-1" })],
      historicalEvents: [historical],
      states
    });

    expect(draft.eventCount).toBe(1);
    expect(draft.historicalEventCount).toBe(1);
    expect(draft.content).toContain("Historical Evidence");
    expect(draft.content).not.toContain("sold this week");
  });

  it("removes duplicate events before selecting evidence IDs", () => {
    const duplicateFingerprint = "ebay|zoro|sale";
    const events = [
      event({ id: "evt-a", duplicateFingerprint }),
      event({ id: "evt-b", duplicateFingerprint })
    ];
    const deduped = dedupeNewsletterEvents(events);

    expect(deduped.map((item) => item.id)).toEqual(["evt-a"]);

    const draft = buildNewsletterDraft({ from, to, generatedAt: to, events, states });

    expect(draft.relatedEvidenceIds).toEqual(["evt-a"]);
  });

  it("labels bundles, review-required events, active asks, condition, and graded raw equivalents", () => {
    const draft = buildNewsletterDraft({
      from,
      to,
      generatedAt: to,
      events: [
        event({ id: "bundle-1", eventType: "BUNDLE_SALE", notes: "Bundle, not item-level allocation." }),
        event({
          id: "review-1",
          eventType: "OUTLIER_TRANSACTION",
          validationStatus: "REVIEW_REQUIRED",
          isGraded: true,
          grader: "PSA",
          grade: "9",
          rawEquivalentPhp: 30725
        }),
        event({ id: "ask-1", eventType: "ACTIVE_LISTING", phpAmount: 210000 })
      ],
      states
    });

    expect(draft.content).toContain("Bundle Sale");
    expect(draft.content).toContain("Review Required");
    expect(draft.content).toContain("Active Ask");
    expect(draft.content).toContain("condition NEAR_MINT");
    expect(draft.content).toContain("graded PSA 9");
    expect(draft.content).toContain("raw equivalent");
  });

  it("reads prices from state and snapshots instead of calculating prices from market events", () => {
    const draft = buildNewsletterDraft({
      from,
      to,
      generatedAt: to,
      events: [event({ id: "sale-1", phpAmount: 999999 })],
      states,
      snapshots: [
        {
          cardCode: "F03-03",
          publishedPricePhp: 150000,
          movementPercent: 2.5,
          createdAt: "2026-08-24T12:00:00.000Z"
        }
      ]
    });

    expect(draft.content).toContain("Published Price: ₱150,000");
    expect(draft.content).toContain("7-Day Movement: +2.50%");
    expect(draft.content).not.toContain("Published Price: ₱999,999");
  });

  it("keeps drafts safe and never writes in preview mode", () => {
    expect(getNewsletterPersistenceAction(undefined, true)).toBe("PREVIEW_ONLY");
    expect(getNewsletterPersistenceAction(undefined, false)).toBe("INSERT_DRAFT");
    expect(getNewsletterPersistenceAction("DRAFT", false)).toBe("UPDATE_DRAFT");
    expect(getNewsletterPersistenceAction("PUBLISHED", false)).toBe("BLOCK_PUBLISHED");
  });

  it("excludes stale minor events from newsletter selection", () => {
    expect(isMeaningfulNewsletterEvent(event({ eventType: "LISTING_ENDED" }))).toBe(false);
    expect(isMeaningfulNewsletterEvent(event({ validationStatus: "REJECTED" }))).toBe(false);
    expect(isMeaningfulNewsletterEvent(event({ eventType: "VERSION_CONFIRMED" }))).toBe(true);
  });
});
