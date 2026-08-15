-- Supabase Migration 004 - Autonomous Market Watch

-- You can copy this whole file into Supabase SQL Editor and click Run.
-- Every instruction line is a SQL comment, so Supabase will not fail on Markdown.

-- Autonomous Market Watch architecture.
-- This migration is additive and preserves existing live card_versions/price_snapshots data.

create table if not exists market_states (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  card_code text not null,
  card_name text not null,
  rarity text not null,
  version text not null,
  initial_reference_price_php numeric(12, 2) not null,
  previous_published_price_php numeric(12, 2) not null,
  calculated_price_php numeric(12, 2) not null,
  published_price_php numeric(12, 2) not null,
  active_override_price_php numeric(12, 2),
  active_override_reason text,
  override_starts_at timestamptz,
  override_expires_at timestamptz,
  confidence text not null default 'UNKNOWN',
  last_evidence_check_at timestamptz,
  last_material_event_at timestamptz,
  last_calculated_at timestamptz,
  last_published_at timestamptz,
  source_card_version_id uuid references card_versions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, version)
);

create table if not exists market_events (
  id uuid primary key default gen_random_uuid(),
  card_id uuid references cards(id),
  card_version_id uuid references card_versions(id),
  card_code text not null,
  version text not null,
  marketplace text not null,
  source_url text not null,
  marketplace_listing_id text,
  marketplace_transaction_id text,
  seller_id text,
  seller_name text,
  event_type text not null,
  event_at timestamptz not null,
  discovered_at timestamptz not null default now(),
  processed_at timestamptz,
  currency text not null,
  native_amount numeric(12, 2),
  php_amount numeric(12, 2),
  fx_rate numeric(18, 8),
  fx_rate_timestamp timestamptz,
  listing_price numeric(12, 2),
  sale_price numeric(12, 2),
  condition text,
  condition_confidence integer check (condition_confidence between 0 and 100),
  bid_count integer,
  watcher_count integer,
  cart_count integer,
  offer_count integer,
  watcher_delta integer,
  cart_delta integer,
  bid_delta integer,
  validation_status text not null,
  seller_confidence integer check (seller_confidence between 0 and 100),
  version_confidence integer check (version_confidence between 0 and 100),
  comparability_confidence integer check (comparability_confidence between 0 and 100),
  evidence_confidence integer check (evidence_confidence between 0 and 100),
  independence_confidence integer check (independence_confidence between 0 and 100),
  duplicate_of uuid references market_events(id),
  duplicate_fingerprint text not null,
  idempotency_key text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (duplicate_fingerprint),
  unique (idempotency_key)
);

create table if not exists engagement_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_event_id uuid references market_events(id) on delete cascade,
  marketplace text not null,
  marketplace_listing_id text not null,
  observed_at timestamptz not null default now(),
  watcher_count integer,
  bid_count integer,
  cart_count integer,
  offer_count integer,
  watcher_delta integer,
  bid_delta integer,
  cart_delta integer,
  offer_delta integer,
  unique (marketplace, marketplace_listing_id, observed_at)
);

create table if not exists market_source_status (
  id uuid primary key default gen_random_uuid(),
  source_code text not null unique,
  status text not null default 'OFFLINE',
  last_check_at timestamptz,
  last_successful_check_at timestamptz,
  last_material_event_at timestamptz,
  last_price_calculation_at timestamptz,
  error_message text,
  cursor jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table price_snapshots
  add column if not exists previous_published_price_php numeric(12, 2),
  add column if not exists kpi_scores jsonb not null default '{}'::jsonb,
  add column if not exists evidence_ids uuid[] not null default '{}'::uuid[],
  add column if not exists raw_movement_percent numeric(7, 4),
  add column if not exists capped_movement_percent numeric(7, 4),
  add column if not exists override_price_php numeric(12, 2),
  add column if not exists pricing_rule_version text,
  add column if not exists calculated_at timestamptz;

update price_snapshots
set
  previous_published_price_php = coalesce(previous_published_price_php, published_price_php),
  raw_movement_percent = coalesce(raw_movement_percent, calculated_movement_percent),
  capped_movement_percent = coalesce(capped_movement_percent, calculated_movement_percent),
  pricing_rule_version = coalesce(pricing_rule_version, methodology_version),
  calculated_at = coalesce(calculated_at, created_at)
where previous_published_price_php is null
   or raw_movement_percent is null
   or capped_movement_percent is null
   or pricing_rule_version is null
   or calculated_at is null;

insert into market_states (
  card_id,
  card_code,
  card_name,
  rarity,
  version,
  initial_reference_price_php,
  previous_published_price_php,
  calculated_price_php,
  published_price_php,
  confidence,
  last_calculated_at,
  last_published_at,
  source_card_version_id
)
select
  cards.id,
  cards.card_number,
  cards.character_name,
  rarities.code,
  card_versions.version_code,
  coalesce(card_versions.initial_reference_price_php, card_versions.current_published_price_php, 0),
  coalesce(card_versions.current_published_price_php, 0),
  coalesce(card_versions.current_calculated_price_php, card_versions.current_published_price_php, 0),
  coalesce(card_versions.current_published_price_php, 0),
  case
    when card_versions.verification_status = 'confirmed' then 'HIGH'
    when card_versions.verification_status = 'modeled' then 'MODERATE'
    else 'LOW'
  end,
  card_versions.last_market_update_at,
  card_versions.last_market_update_at,
  card_versions.id
from card_versions
join cards on cards.id = card_versions.card_id
join rarities on rarities.id = cards.rarity_id
where card_versions.pricing_state in ('LIVE', 'FROZEN')
on conflict (card_id, version) do update
set
  card_code = excluded.card_code,
  card_name = excluded.card_name,
  rarity = excluded.rarity,
  previous_published_price_php = excluded.previous_published_price_php,
  calculated_price_php = excluded.calculated_price_php,
  published_price_php = excluded.published_price_php,
  confidence = excluded.confidence,
  last_calculated_at = excluded.last_calculated_at,
  last_published_at = excluded.last_published_at,
  source_card_version_id = excluded.source_card_version_id,
  updated_at = now();

create or replace function protect_initial_reference_price()
returns trigger as $$
begin
  if old.initial_reference_price_php is distinct from new.initial_reference_price_php
     and coalesce(current_setting('app.market_operation', true), '') not in ('REBASE', 'REINITIALIZE') then
    raise exception 'initial_reference_price_php can only change during audited REBASE or REINITIALIZE';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists card_versions_protect_initial_reference_price on card_versions;
create trigger card_versions_protect_initial_reference_price
before update on card_versions
for each row
execute function protect_initial_reference_price();

alter table market_states enable row level security;
alter table market_events enable row level security;
alter table engagement_snapshots enable row level security;
alter table market_source_status enable row level security;

drop policy if exists "public read market states" on market_states;
create policy "public read market states" on market_states for select using (true);

drop policy if exists "public read accepted market events" on market_events;
create policy "public read accepted market events" on market_events
  for select using (validation_status in ('ACCEPTED', 'DISCOUNTED', 'REVIEW_REQUIRED'));

drop policy if exists "public read source status" on market_source_status;
create policy "public read source status" on market_source_status for select using (true);
