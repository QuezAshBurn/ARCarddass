# Film Z - market evidence and initial pricing

Run the SQL in [009_initialize_film_z_pricing.sql](009_initialize_film_z_pricing.sql) in Supabase **after** migration 008.

## Safe paste procedure

The SQL file is a single transaction and must be pasted **in full**. Do not run a partial selection.

1. In Supabase SQL Editor, click inside the query, then press `Ctrl+A` and `Delete`.
2. Open the `.sql` file, press `Ctrl+A`, then copy and paste everything into Supabase.
3. Scroll to the very bottom before clicking **Run**. The final non-empty line must be `commit;`.

If the editor stops at `on conflict (duplicate_fingerprint) do update`, the paste was cut off. The next line must be `set source_url = excluded.source_url,` followed by the rest of the file. Delete the partial query and paste the entire file again.

This is database data, not UI fallback data. It does four things:

1. Corrects **F04-45** to Monkey D. Luffy.
2. Stores one raw marketplace evidence record per Film Z card in `market_events`, including source URL, listing currency, FX conversion, condition, confidence, and review status.
3. Publishes each Film Z JP card as `LIVE` with its observed raw asking reference and explicit demand/scarcity scores.
4. Applies this initial-price formula:

```text
published price = raw asking reference * (1 + 6% OR rarity premium + demand premium)
demand premium = (demand score - 50) * 0.2%
```

The initial premium is stored in the price snapshot `kpi_scores` JSON. It is not presented as a scheduled market movement; later automated runs use the normal evidence gates and movement caps.

## Re-checked Film Z raw references

These are the highest exact raw asks found for the four cards below in the latest research pass. The selected PHP price includes the formula above.

| Card | Highest matched raw reference | Published starting price |
| --- | ---: | ---: |
| F04-36 Usopp | US$59.50 (Mercari US) | PHP 3,932 |
| F04-37 Sanji | S$50 (Carousell SG) | PHP 2,613 |
| F04-40 Franky | GBP21.05 (eBay UK, new) | PHP 1,794 |
| F04-41 Brook | JPY4,999 (Mercari JP) | PHP 2,113 |

The Sanji research also found a matching Mercari JP listing at JPY 1,400, which is lower than the selected raw reference. The exact Franky and Brook markets remain review-required because their usable evidence is thin, even though the selected raw references are higher than the earlier candidates.

## Important

- Raw market evidence takes priority. Graded-to-raw conversion is not used here because every Film Z card has raw-listing evidence.
- A few sources are thin, old, damaged, or ended. These remain `LOW` confidence / `REVIEW_REQUIRED` rather than being treated as confirmed sale records.
- The final query displays the ten Film Z cards and their new published prices. Refresh the website after it returns rows.
