-- Collector Pricing fields.
-- Additive migration: does not copy Market Price into Collector Price.

alter table market_states
  add column if not exists collector_price_php numeric(12, 2),
  add column if not exists collector_price_confidence text not null default 'INSUFFICIENT_DATA',
  add column if not exists verified_sale_low_php numeric(12, 2),
  add column if not exists verified_sale_median_php numeric(12, 2),
  add column if not exists verified_sale_high_php numeric(12, 2),
  add column if not exists verified_sale_count integer not null default 0,
  add column if not exists reseller_ask_low_php numeric(12, 2),
  add column if not exists reseller_ask_median_php numeric(12, 2),
  add column if not exists reseller_ask_high_php numeric(12, 2),
  add column if not exists reseller_ask_count integer not null default 0,
  add column if not exists quick_sale_price_php numeric(12, 2),
  add column if not exists collector_tier text,
  add column if not exists collector_price_updated_at timestamptz,
  add column if not exists collector_pricing_rule_version text not null default '1.0.0';

alter table price_snapshots
  add column if not exists collector_price_php numeric(12, 2),
  add column if not exists collector_price_confidence text,
  add column if not exists verified_sale_low_php numeric(12, 2),
  add column if not exists verified_sale_median_php numeric(12, 2),
  add column if not exists verified_sale_high_php numeric(12, 2),
  add column if not exists verified_sale_count integer not null default 0,
  add column if not exists reseller_ask_low_php numeric(12, 2),
  add column if not exists reseller_ask_median_php numeric(12, 2),
  add column if not exists reseller_ask_high_php numeric(12, 2),
  add column if not exists reseller_ask_count integer not null default 0,
  add column if not exists quick_sale_price_php numeric(12, 2),
  add column if not exists collector_tier text,
  add column if not exists collector_price_updated_at timestamptz,
  add column if not exists collector_pricing_rule_version text;

alter table market_events
  add column if not exists buyer_id text,
  add column if not exists duplicate_group_id text,
  add column if not exists outlier_reason text;
