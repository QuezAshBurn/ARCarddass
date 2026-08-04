-- Allow two or more automated market-price snapshots per day.
-- The original MVP used date-only weekly periods, which would make noon and
-- midnight updates collide on the same unique key.

alter table price_snapshots
  alter column pricing_period_start type timestamptz
  using pricing_period_start::timestamptz,
  alter column pricing_period_end type timestamptz
  using pricing_period_end::timestamptz;