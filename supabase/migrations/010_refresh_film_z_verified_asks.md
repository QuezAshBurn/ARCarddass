# Film Z refreshed price script

This script updates only the four Film Z cards reviewed today: Usopp, Sanji, Franky, and Brook.

Run [010_refresh_film_z_verified_asks.sql](010_refresh_film_z_verified_asks.sql) in Supabase SQL Editor.

1. Confirm `008_seed_film_z_catalogue.sql` has already completed successfully.
2. Open the SQL file and copy its entire content, from `begin;` to `commit;`.
3. In Supabase SQL Editor, press `Ctrl+A`, paste the script, and click **Run**.
4. Review the four returned rows. Refresh the deployed website when the query succeeds.

It records the raw marketplace evidence, intentionally rebases the database reference, publishes the rarity-and-demand adjusted price, updates the market state, and refreshes the current price snapshot.

| Card | Raw marketplace reference | Published price |
| --- | ---: | ---: |
| F04-36 Usopp | US$59.50 | PHP 3,932 |
| F04-37 Sanji | S$50 | PHP 2,613 |
| F04-40 Franky | GBP21.05 | PHP 1,794 |
| F04-41 Brook | JPY4,999 | PHP 2,113 |

The script retains a `LOW` confidence display for thin or asking-only evidence. This does not mean the values are ignored; it tells visitors the source is not a confirmed sold transaction.
