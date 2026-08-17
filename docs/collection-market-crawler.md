# Collection-wide market collector

The collector always starts from the Supabase catalogue, so it covers all current **King Rare**, **Wanted**, and **Film Z** cards without adding card names to a script.

## Run now

In PowerShell, from the project folder:

```powershell
$env:MARKET_CRON_BASE_URL = "https://arcarddass.vercel.app"
$env:CRON_SECRET = "your-existing-cron-secret"
npm run market:collect
```

This calls the same protected endpoints used by the scheduled GitHub Action:

1. `GET /api/cron/collect-market-data` loads every card and imports supported marketplace evidence.
2. `GET /api/cron/update-market-prices` applies the raw-sold → raw-ask → graded-fallback priority.

To publish pricing from evidence already stored in Supabase, without collecting
new listings first, run:

```powershell
npm run pricing:update:all
```

Neither command contains price values. Both load the current database-backed
catalogue and market events through the authenticated pricing API.

## Source coverage

- **eBay:** active-listing import works automatically after `EBAY_BROWSE_API_TOKEN` (or `EBAY_ACCESS_TOKEN`) is configured in Vercel. It uses eBay's official Browse API and records both raw and graded listings.
- **Mercari Japan, Yahoo Auctions, Yahoo Fleamarket, JDirectItems/Remambo, Mandarake, Suruga-ya, Rakuma:** the job creates traceable search targets for every card and reports their source status. They must be connected through an approved official API or licensed partner feed before their data can be imported automatically.

The collector does not silently scrape protected marketplace pages. Every stored event requires a source URL, event date, original currency/value, and validation status. Ambiguous eBay title matches are saved as `REVIEW_REQUIRED`, so they appear in the public evidence trail but cannot move a price automatically.

## Automatic three-hour schedule

`.github/workflows/hourly-market-watch.yml` runs the two endpoints every three hours at minute 17. Set the same `CRON_SECRET` in both **Vercel** and **GitHub Actions**. Set the eBay token in Vercel for real eBay imports.
