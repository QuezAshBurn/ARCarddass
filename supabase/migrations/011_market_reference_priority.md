# Market reference priority migration

This enables the price selection hierarchy:

1. Highest accepted **raw completed sale** dated within the last 90 days.
2. If there is no eligible raw sale, highest accepted **raw active ask** observed in the last 12 hours.
3. Only if neither exists, the highest accepted **graded** reference converted to a raw-card value.

## Run it in Supabase

1. Open **Supabase → SQL Editor → New query**.
2. Open [011_market_reference_priority.sql](011_market_reference_priority.sql) in the project.
3. Copy **only the SQL file contents**—from `begin;` through `commit;`.
4. Paste it into the SQL Editor and select **Run**.

It is safe to run once and does not alter existing prices. It only adds the metadata the automated marketplace collector needs.
