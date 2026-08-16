-- Film Z evidence rebase: Usopp, Sanji, Franky, and Brook.
--
-- This is an incremental, re-runnable update. It keeps the highest exact raw
-- marketplace ask found for each listed card, then applies the initial-price
-- formula already used for Film Z:
--   published = raw ask PHP * (1 + 6% OR premium + demand premium)
--   demand premium = (demand score - 50) * 0.2%
--
-- Run the WHOLE file in Supabase SQL Editor. It requires the Film Z catalogue
-- from 008_seed_film_z_catalogue.sql. It does not depend on 009 being run.

begin;

select set_config('app.market_operation', 'REBASE', true);

with refreshed_evidence (
  card_number,
  marketplace,
  source_url,
  marketplace_listing_id,
  native_amount,
  currency,
  fx_rate,
  condition,
  validation_status,
  demand_score,
  scarcity_score,
  source_confidence,
  source_note
) as (
  values
    ('F04-36', 'Mercari US', 'https://www.mercari.com/us/item/m10039791770/', 'm10039791770', 59.50, 'USD', 60.30000000, 'MODERATE_PLAY', 'ACCEPTED', 68, 72, 80, 'Highest exact raw F04-36 Usopp Film Z ask found: US$59.50; condition listed as Good.'),
    ('F04-37', 'Carousell SG', 'https://www.carousell.sg/toys-collectibles/one-piece-ar-carddass/q-12/', '1408292597', 50.00, 'SGD', 47.00000000, 'UNKNOWN', 'REVIEW_REQUIRED', 76, 74, 60, 'Highest exact raw F04-37 Sanji Film Z ask found: S$50. A Mercari JP JPY1400 listing was lower.'),
    ('F04-40', 'eBay UK', 'https://www.ebay.co.uk/itm/366372242608', '366372242608', 21.05, 'GBP', 79.50000000, 'NEW', 'REVIEW_REQUIRED', 56, 70, 70, 'Highest exact raw F04-40 Franky Film Z ask found: GBP21.05 on eBay UK, listed as New.'),
    ('F04-41', 'Mercari JP', 'https://jp.mercari.com/shops/product/2JQmHqFnrdksyV8gdQ95hw', '2JQmHqFnrdksyV8gdQ95hw', 4999.00, 'JPY', 0.39000000, 'UNKNOWN', 'REVIEW_REQUIRED', 62, 68, 70, 'Highest exact raw F04-41 Brook Film Z ask found: JPY4999. This exceeds the lower damaged S$20 and JPY1400 references.')
), prepared as (
  select
    evidence.*,
    round(evidence.native_amount * evidence.fx_rate) as raw_price_php,
    round((0.06 + ((evidence.demand_score - 50) * 0.002)) * 100, 2) as total_premium_percent,
    round(evidence.native_amount * evidence.fx_rate * (1 + 0.06 + ((evidence.demand_score - 50) * 0.002))) as published_price_php
  from refreshed_evidence evidence
), upserted_events as (
  insert into market_events (
    card_id, card_version_id, card_code, version, marketplace, source_url,
    marketplace_listing_id, event_type, event_at, discovered_at, processed_at,
    currency, native_amount, php_amount, fx_rate, fx_rate_timestamp,
    listing_price, condition, condition_confidence, validation_status,
    seller_confidence, version_confidence, comparability_confidence,
    evidence_confidence, independence_confidence, duplicate_fingerprint,
    idempotency_key, notes
  )
  select
    cards.id, versions.id, prepared.card_number, 'JP', prepared.marketplace,
    prepared.source_url, prepared.marketplace_listing_id, 'ACTIVE_LISTING',
    now(), now(), now(), prepared.currency, prepared.native_amount,
    prepared.raw_price_php, prepared.fx_rate, now(), prepared.raw_price_php,
    prepared.condition, prepared.source_confidence, prepared.validation_status,
    prepared.source_confidence, 95, prepared.source_confidence,
    prepared.source_confidence, 90,
    'film-z-rebase:' || prepared.card_number || ':' || prepared.marketplace_listing_id,
    'film-z-rebase:' || prepared.card_number || ':' || prepared.marketplace_listing_id,
    prepared.source_note || ' Rebase formula: raw ask * (1 + ' || prepared.total_premium_percent || '% OR rarity-and-demand premium).'
  from prepared
  join cards on cards.card_number = prepared.card_number and cards.catalogue_group = 'Film Z'
  join card_versions versions on versions.card_id = cards.id and versions.version_code = 'JP'
  on conflict (duplicate_fingerprint) do update
  set source_url = excluded.source_url,
      native_amount = excluded.native_amount,
      php_amount = excluded.php_amount,
      fx_rate = excluded.fx_rate,
      listing_price = excluded.listing_price,
      condition = excluded.condition,
      validation_status = excluded.validation_status,
      notes = excluded.notes,
      processed_at = now(),
      updated_at = now()
  returning card_id, card_version_id
), rebased_versions as (
  update card_versions versions
  set
    verification_status = 'needs-review',
    pricing_state = 'LIVE',
    initial_reference_price_php = prepared.raw_price_php,
    initial_reference_locked_at = coalesce(versions.initial_reference_locked_at, now()),
    current_calculated_price_php = prepared.published_price_php,
    current_published_price_php = prepared.published_price_php,
    high_water_reference_php = greatest(coalesce(versions.high_water_reference_php, 0), prepared.raw_price_php),
    last_market_update_at = now(),
    updated_at = now()
  from prepared
  join cards on cards.card_number = prepared.card_number and cards.catalogue_group = 'Film Z'
  where versions.card_id = cards.id
    and versions.version_code = 'JP'
  returning versions.id, versions.card_id
), upserted_states as (
  insert into market_states (
    card_id, card_code, card_name, rarity, version, product_line,
    initial_reference_price_php, previous_published_price_php,
    calculated_price_php, published_price_php, confidence,
    last_evidence_check_at, last_material_event_at, last_calculated_at,
    last_published_at, source_card_version_id, demand_score, scarcity_score,
    direct_evidence_count, modeled_evidence_count
  )
  select
    cards.id, cards.card_number, cards.character_name, rarities.code, 'JP', 'Formation',
    prepared.raw_price_php, prepared.published_price_php,
    prepared.published_price_php, prepared.published_price_php, 'LOW',
    now(), now(), now(), now(), versions.id, prepared.demand_score,
    prepared.scarcity_score, 1, 0
  from prepared
  join cards on cards.card_number = prepared.card_number and cards.catalogue_group = 'Film Z'
  join rarities on rarities.id = cards.rarity_id
  join card_versions versions on versions.card_id = cards.id and versions.version_code = 'JP'
  on conflict (card_id, version) do update
  set card_code = excluded.card_code,
      card_name = excluded.card_name,
      rarity = excluded.rarity,
      product_line = excluded.product_line,
      initial_reference_price_php = excluded.initial_reference_price_php,
      previous_published_price_php = excluded.previous_published_price_php,
      calculated_price_php = excluded.calculated_price_php,
      published_price_php = excluded.published_price_php,
      confidence = excluded.confidence,
      last_evidence_check_at = excluded.last_evidence_check_at,
      last_material_event_at = excluded.last_material_event_at,
      last_calculated_at = excluded.last_calculated_at,
      last_published_at = excluded.last_published_at,
      source_card_version_id = excluded.source_card_version_id,
      demand_score = excluded.demand_score,
      scarcity_score = excluded.scarcity_score,
      direct_evidence_count = excluded.direct_evidence_count,
      modeled_evidence_count = excluded.modeled_evidence_count,
      updated_at = now()
  returning card_id
)
insert into price_snapshots (
  card_version_id, pricing_period_start, pricing_period_end,
  transaction_score, buyer_intent_score, search_demand_score, scarcity_score,
  price_momentum_score, market_breadth_score, market_score, movement_cap_percent,
  calculated_movement_percent, previous_published_price_php, kpi_scores,
  raw_movement_percent, capped_movement_percent, calculated_price_php,
  published_price_php, confidence, methodology_version, pricing_rule_version,
  calculated_at
)
select
  versions.id, current_date, current_date + 1,
  0, prepared.demand_score, round(45 + prepared.demand_score * 0.35),
  prepared.scarcity_score, 0, 42, prepared.demand_score,
  0, 0, prepared.published_price_php,
  jsonb_build_object(
    'initialization', 'FILM_Z_HIGHEST_RAW_ASK_REBASE',
    'rawAskPhp', prepared.raw_price_php,
    'orRarityPremiumPercent', 6,
    'demandScore', prepared.demand_score,
    'demandPremiumPercent', round((prepared.demand_score - 50) * 0.2, 2),
    'totalInitialPremiumPercent', prepared.total_premium_percent,
    'sourceConfidence', prepared.source_confidence
  ),
  0, 0, prepared.published_price_php, prepared.published_price_php,
  'LOW', '1.0.0', '1.0.0', now()
from prepared
join cards on cards.card_number = prepared.card_number and cards.catalogue_group = 'Film Z'
join card_versions versions on versions.card_id = cards.id and versions.version_code = 'JP'
on conflict (card_version_id, pricing_period_start, pricing_period_end) do update
set buyer_intent_score = excluded.buyer_intent_score,
    search_demand_score = excluded.search_demand_score,
    scarcity_score = excluded.scarcity_score,
    market_score = excluded.market_score,
    kpi_scores = excluded.kpi_scores,
    calculated_price_php = excluded.calculated_price_php,
    published_price_php = excluded.published_price_php,
    confidence = excluded.confidence,
    calculated_at = now();

select
  cards.card_number,
  cards.character_name,
  versions.initial_reference_price_php as raw_ask_php,
  versions.current_published_price_php as published_price_php,
  states.demand_score,
  states.scarcity_score,
  versions.last_market_update_at
from cards
join card_versions versions on versions.card_id = cards.id and versions.version_code = 'JP'
left join market_states states on states.card_id = cards.id and states.version = 'JP'
where cards.card_number in ('F04-36', 'F04-37', 'F04-40', 'F04-41')
  and cards.catalogue_group = 'Film Z'
order by cards.card_number;

commit;
