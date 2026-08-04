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
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
```

The current implementation ships a data-driven public shell, API stubs, pricing-rule code, tests, and Supabase schema scaffolding. Live collectors and admin mutations are intentionally isolated behind route and database boundaries so marketplace/API credentials remain server-side.
