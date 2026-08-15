# AR Carddass Market Rules

Rule version: `1.0.0`

The market engine is deterministic. Codex, marketplace descriptions, seller text, and generated language do not decide what a card is worth.

## Operating principles

- Initial reference prices are one-time baselines.
- Normal scheduled jobs must not mutate the initial reference price.
- Recurring market pricing starts from the latest approved published price.
- If an admin override is active, the override is the public price while the calculated price continues to be preserved.
- No fresh meaningful evidence means zero price movement.
- Verified transactions influence pricing but do not automatically reset published prices.
- Large or suspicious events go to review instead of resetting the market.

## Evidence statuses

- `ACCEPTED`: eligible for KPI scoring.
- `DISCOUNTED`: kept for history but excluded or reduced.
- `QUARANTINED`: stored privately for follow-up.
- `REVIEW_REQUIRED`: requires human review before it can move price.
- `REJECTED`: not usable.

## Event timing

`eventAt`, `discoveredAt`, and `processedAt` are different.

A sale that happened two weeks ago but is discovered today may be stored, but it does not create fake current-slot selling velocity.

## Signal windows

| Signal | Active window |
| --- | ---: |
| Search demand | 7 days |
| Watcher effect | 7 days |
| Cart effect | 3 days |
| Unsold asking-price momentum | 30 days |

## Movement caps

| Verified sale regime | Maximum movement |
| --- | ---: |
| No verified sale | ±1.5% |
| One independent verified sale | ±7.5% |
| Multiple independent verified sales | ±12% |

These are ceilings, not forced movement.

## Condition comparability

Cheap played or damaged cards may inform supply/liquidity, but they do not directly drag premium Near Mint pricing down.

| Condition | Comparability |
| --- | ---: |
| Mint | 1.00 |
| Near Mint | 1.00 |
| Light Play | 0.72 |
| Moderate Play | 0.45 |
| Heavy Play | 0.25 |
| Damaged | 0.12 |
| Unknown | 0.35 |

## Public APIs

- `GET /api/market/snapshot` returns authoritative public market state.
- `GET /api/market/events` returns public evidence history with filters.
- `GET /api/market/monitor` returns market monitor health.
- `GET /api/market/cards/{cardNumber}/pricing` returns version-level Market Index and Collector Price details for one card.

## Collector Price

Collector Price is separate from Market Price / Market Index.

Collector Price estimates what a knowledgeable collector may reasonably pay today for a comparable raw Near Mint copy. It prioritizes:

1. accepted verified sales;
2. comparable condition;
3. comparable language/version;
4. recency;
5. independent buyers/sellers;
6. market breadth.

Active reseller asking prices are shown publicly, but they do not directly set Collector Price.

If no accepted comparable verified sale exists, Collector Price is `null` and the UI shows:

```text
Insufficient data
```

It must not silently fall back to Market Index.

## Admin API

- `POST /api/admin/market/events` ingests market evidence.
- Requires `Authorization: Bearer <MARKET_EVENT_INGEST_SECRET>`.
- Supports `Idempotency-Key`.
- Duplicate evidence returns the existing event instead of processing twice.

## Configuration source

Machine-readable rules live in:

```text
config/market-rules.json
```

When pricing rules change:

1. Update `config/market-rules.json`.
2. Update tests.
3. Update this document.
4. Increment `pricingRuleVersion`.

Historical snapshots must keep their original `pricingRuleVersion`.
