# Three-hour market automation setup

Vercel Hobby cannot run more than one cron job per day, so the three-hour collector and price update run through GitHub Actions instead.

1. Open the repository’s **Settings** → **Secrets and variables** → **Actions**.
2. Select **New repository secret**.
3. Name it `CRON_SECRET`.
4. Paste the exact same value used for `CRON_SECRET` in Vercel → Project → Settings → Environment Variables.
5. Open **Actions** → **Hourly market watch** → **Run workflow** once to test it.

It then calls the collector and price-update endpoints at minute 17 every three hours (UTC). GitHub may occasionally delay scheduled workflows, but no redeploy is needed for routine price updates because the website reads current values from Supabase.
