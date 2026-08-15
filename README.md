# AR Carddass

Public pricing-guide website for One Piece AR Carddass Formation cards.

This repository starts with the eight-card premium MVP described in `ARCarddassWebsite.md`:

- Monkey D. Luffy F01-01 KR
- Portgas D. Ace F01-37 KR
- Boa Hancock F02-20 KR
- Crocodile F02-24 KR
- Roronoa Zoro F03-03 KR
- Sanji F03-13 KR
- Rob Lucci F04-13 KR
- Sogeking F04-27 SKR

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm test
npm run build
```

## Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
MARKET_EVENT_INGEST_SECRET=
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
```

`MARKET_EVENT_INGEST_SECRET` protects the admin evidence-ingestion API. If it is not set, the route falls back to `ADMIN_MARKET_EVENT_SECRET` and then `CRON_SECRET`.

## Market-watch APIs

```text
GET  /api/market/snapshot
GET  /api/market/events
GET  /api/market/monitor
GET  /api/market/cards/[cardNumber]/pricing
POST /api/admin/market/events
```

Admin ingestion requires:

```http
Authorization: Bearer <MARKET_EVENT_INGEST_SECRET>
Idempotency-Key: <stable event key>
```

The current implementation ships a data-driven public shell, deterministic pricing-rule code, Collector Price calculations, tests, Supabase schema scaffolding, public market APIs, and a protected evidence-ingestion boundary. Live marketplace collectors remain pluggable so marketplace/API credentials stay server-side and source failures do not create false market signals.
