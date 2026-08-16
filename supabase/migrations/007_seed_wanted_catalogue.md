# Wanted catalogue: one-time Supabase setup

Run the complete SQL from `007_seed_wanted_catalogue.sql` in Supabase SQL Editor using **Run**. Do not copy individual lines from the middle of the file.

This one script is idempotent: it is safe to run again. It adds the catalogue fields, seeds 21 Wanted cards, creates their JP versions and initial market states, and leaves later hourly price changes intact.

After it succeeds, verify the seed with:

```sql
select
  c.card_number,
  c.character_name,
  c.product_line,
  cv.current_published_price_php,
  cv.last_market_update_at
from cards c
join card_versions cv on cv.card_id = c.id
where c.product_line = 'Wanted'
order by c.card_number;
```

Expected result: 21 rows. `W02-02` (Monkey D. Luffy) starts at `18571` PHP from the recorded US$303 raw asking reference. After setup, scheduled collectors and price calculations update Supabase records only; no git push or Vercel redeploy is needed for normal price updates.
