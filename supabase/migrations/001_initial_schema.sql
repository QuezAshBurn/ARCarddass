create extension if not exists "pgcrypto";

create type pricing_state as enum (
  'UNINITIALIZED',
  'INITIALIZED',
  'LIVE',
  'FROZEN',
  'REBASE_PENDING'
);

create type job_run_status as enum (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'PARTIAL',
  'FAILED',
  'CANCELLED'
);

create table sets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  release_date date,
  display_order integer not null default 0,
  status text not null default 'active'
);

create table rarities (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  display_order integer not null default 0,
  pricing_tier_default integer
);

create table cards (
  id uuid primary key default gen_random_uuid(),
  card_number text not null unique,
  character_name text not null,
  set_id uuid not null references sets(id),
  rarity_id uuid not null references rarities(id),
  category text,
  pricing_tier integer not null default 1,
  pricing_enabled boolean not null default true,
  catalogue_status text not null default 'seeded',
  front_image_path text,
  back_image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table card_versions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  version_code text not null,
  language text not null,
  region text not null,
  verification_status text not null default 'needs-review',
  pricing_state pricing_state not null default 'UNINITIALIZED',
  initial_reference_price_php numeric(12, 2),
  initial_reference_locked_at timestamptz,
  current_calculated_price_php numeric(12, 2),
  current_published_price_php numeric(12, 2),
  high_water_reference_php numeric(12, 2),
  highest_verified_sale_php numeric(12, 2),
  last_collection_at timestamptz,
  last_market_update_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_id, version_code)
);

create table marketplaces (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  base_url text,
  connector_type text not null,
  capability_flags jsonb not null default '{}'::jsonb,
  enabled boolean not null default true
);

create table market_listings (
  id uuid primary key default gen_random_uuid(),
  marketplace_id uuid not null references marketplaces(id),
  external_id text not null,
  canonical_url text,
  seller_identifier text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  current_status text not null,
  duplicate_group_id uuid,
  raw_payload_hash text,
  unique (marketplace_id, external_id)
);

create table listing_snapshots (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references market_listings(id) on delete cascade,
  observed_at timestamptz not null default now(),
  original_currency text not null,
  original_price numeric(12, 2) not null,
  php_price numeric(12, 2) not null,
  exchange_rate_id uuid,
  status text not null,
  watchers integer,
  bids integer,
  views integer,
  cart_signal boolean,
  title text,
  description_hash text,
  image_hashes text[]
);

create table market_evidence (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references market_listings(id),
  card_version_id uuid not null references card_versions(id),
  evidence_type text not null,
  raw_or_graded text not null,
  condition_class text,
  grading_company text,
  grade text,
  sold_at timestamptz,
  original_currency text,
  original_price numeric(12, 2),
  php_price numeric(12, 2),
  confidence integer not null check (confidence between 0 and 100),
  evidence_status text not null default 'stored',
  affected_pricing_stage text,
  created_at timestamptz not null default now()
);

create table price_snapshots (
  id uuid primary key default gen_random_uuid(),
  card_version_id uuid not null references card_versions(id),
  pricing_period_start date not null,
  pricing_period_end date not null,
  transaction_score numeric(5, 2),
  buyer_intent_score numeric(5, 2),
  search_demand_score numeric(5, 2),
  scarcity_score numeric(5, 2),
  price_momentum_score numeric(5, 2),
  market_breadth_score numeric(5, 2),
  market_score numeric(5, 2) not null,
  movement_cap_percent numeric(5, 2) not null,
  calculated_movement_percent numeric(5, 2) not null,
  calculated_price_php numeric(12, 2) not null,
  override_id uuid,
  published_price_php numeric(12, 2) not null,
  confidence text not null,
  methodology_version text not null,
  created_at timestamptz not null default now(),
  unique (card_version_id, pricing_period_start, pricing_period_end)
);

create table admin_overrides (
  id uuid primary key default gen_random_uuid(),
  card_version_id uuid not null references card_versions(id),
  override_type text not null,
  system_value numeric(12, 2),
  override_value numeric(12, 2) not null,
  reason text not null,
  effective_from timestamptz not null default now(),
  expires_at timestamptz,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  removed_by uuid,
  removed_at timestamptz
);

alter table price_snapshots
  add constraint price_snapshots_override_id_fkey
  foreign key (override_id) references admin_overrides(id);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create table job_runs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  run_key text not null,
  status job_run_status not null default 'PENDING',
  started_at timestamptz,
  completed_at timestamptz,
  cursor text,
  processed_count integer not null default 0,
  rejected_count integer not null default 0,
  error_message text,
  retry_count integer not null default 0,
  unique (job_type, run_key)
);

alter table sets enable row level security;
alter table rarities enable row level security;
alter table cards enable row level security;
alter table card_versions enable row level security;
alter table market_evidence enable row level security;
alter table price_snapshots enable row level security;

create policy "public read sets" on sets for select using (true);
create policy "public read rarities" on rarities for select using (true);
create policy "public read cards" on cards for select using (pricing_enabled = true);
create policy "public read live card versions" on card_versions for select using (pricing_state in ('LIVE', 'FROZEN'));
create policy "public read evidence" on market_evidence for select using (evidence_status in ('accepted', 'stored'));
create policy "public read price snapshots" on price_snapshots for select using (true);
