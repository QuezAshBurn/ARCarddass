-- Database-backed market-crawl targets for every live AR Carddass card.
--
-- This migration does not manufacture prices or scrape websites from PostgreSQL.
-- It creates the source-of-truth queue that the scheduled collection worker
-- uses to account for all King Rare, Wanted, and Film Z cards.

create table if not exists market_crawl_targets (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  card_version_id uuid not null references card_versions(id) on delete cascade,
  card_code text not null,
  product_line text not null,
  catalogue_group text,
  version text not null,
  source_code text not null,
  adapter text not null,
  supported_buckets text[] not null default '{}'::text[],
  query_text text not null,
  target_status text not null default 'QUEUED',
  last_checked_at timestamptz,
  last_successful_check_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (card_version_id, source_code)
);

create index if not exists market_crawl_targets_pending_idx
  on market_crawl_targets (target_status, source_code, updated_at);

create or replace function refresh_market_crawl_targets()
returns integer
language plpgsql
as $$
declare
  target_count integer;
begin
  with source_catalog(source_code, adapter, supported_buckets) as (
    values
      ('ebay', 'official-api', array['SOLD', 'ASKING', 'FORMULA_INPUT']::text[]),
      ('mercari_jp', 'search-target', array['SOLD', 'ASKING']::text[]),
      ('yahoo_auction_jp', 'partner-feed', array['SOLD', 'ASKING']::text[]),
      ('jdirect_items', 'search-target', array['SOLD', 'ASKING']::text[]),
      ('yahoo_fleamarket_jp', 'search-target', array['ASKING']::text[]),
      ('mandarake', 'search-target', array['SOLD', 'ASKING']::text[]),
      ('surugaya', 'search-target', array['ASKING']::text[]),
      ('rakuma', 'search-target', array['ASKING']::text[]),
      ('remambo_proxy', 'search-target', array['SOLD', 'ASKING']::text[])
  ),
  prepared as (
    select
      cards.id as card_id,
      card_versions.id as card_version_id,
      cards.card_number as card_code,
      cards.product_line,
      cards.catalogue_group,
      case when card_versions.version_code in ('CN', 'TW') then 'HK' else card_versions.version_code end as version,
      source_catalog.source_code,
      source_catalog.adapter,
      source_catalog.supported_buckets,
      concat_ws(
        ' ',
        'One Piece AR Carddass',
        case
          when cards.catalogue_group = 'Film Z' then 'Film Z'
          when cards.product_line = 'Wanted' then 'Wanted'
          else 'King Rare'
        end,
        cards.character_name,
        cards.card_number,
        nullif(cards.printed_number, '')
      ) as query_text
    from cards
    join card_versions on card_versions.card_id = cards.id
    cross join source_catalog
    where card_versions.pricing_state in ('UNINITIALIZED', 'LIVE', 'FROZEN')
      and card_versions.version_code in ('JP', 'HK', 'CN', 'TW')
  )
  insert into market_crawl_targets (
    card_id,
    card_version_id,
    card_code,
    product_line,
    catalogue_group,
    version,
    source_code,
    adapter,
    supported_buckets,
    query_text,
    target_status,
    updated_at
  )
  select
    prepared.card_id,
    prepared.card_version_id,
    prepared.card_code,
    prepared.product_line,
    prepared.catalogue_group,
    prepared.version,
    prepared.source_code,
    prepared.adapter,
    prepared.supported_buckets,
    prepared.query_text,
    'QUEUED',
    now()
  from prepared
  on conflict (card_version_id, source_code) do update
  set
    card_code = excluded.card_code,
    product_line = excluded.product_line,
    catalogue_group = excluded.catalogue_group,
    version = excluded.version,
    adapter = excluded.adapter,
    supported_buckets = excluded.supported_buckets,
    query_text = excluded.query_text,
    updated_at = now();

  get diagnostics target_count = row_count;
  return target_count;
end;
$$;

select refresh_market_crawl_targets();

alter table market_crawl_targets enable row level security;

drop policy if exists "public read market crawl targets" on market_crawl_targets;
create policy "public read market crawl targets" on market_crawl_targets
  for select using (true);
