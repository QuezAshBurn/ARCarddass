-- Film Z initial market-price publication.
--
-- Source of truth: raw marketplace asking evidence is stored below as market_events.
-- A graded-card conversion is deliberately NOT used: every seeded card has a raw
-- marketplace reference. This follows the site rule that raw-market evidence wins
-- whenever it exists.
--
-- Initial-public-price formula:
--   published price = highest observed raw ask * (1 + OR rarity premium + demand premium)
--   OR rarity premium = 6%
--   demand premium    = (demand score - 50) * 0.2%
--
-- The resulting percentage is a transparent initial collector premium, not a
-- "per update" movement. Subsequent market-watch runs apply the normal evidence
-- gates and movement caps.
--
-- Run this complete SQL file once AFTER 008_seed_film_z_catalogue.sql.

begin;

-- The Film Z records were intentionally seeded without a baseline. This is an
-- audited initialization, so the protected initial reference may now be set.
select set_config('app.market_operation', 'REINITIALIZE', true);

-- F04-45 is a Monkey D. Luffy Film Z card, not a generic Straw Hat Crew card.
update cards
set
  character_name = 'Monkey D. Luffy',
  category = 'One Piece Film Z official rare',
  summary = 'Film Z Luffy group-art card. Initial price uses the highest observed raw asking reference, then the transparent OR-rarity and demand premium.',
  catalogue_status = 'live',
  updated_at = now()
where card_number = 'F04-45'
  and catalogue_group = 'Film Z';

with film_z_price_seed (
  card_number,
  marketplace,
  source_url,
  marketplace_listing_id,
  native_amount,
  currency,
  fx_rate,
  condition,
  event_type,
  validation_status,
  demand_score,
  scarcity_score,
  source_confidence,
  source_note
) as (
  values
    -- Raw active ask, Film Z Luffy identified by exact printed stats (HP 4300/AP 650/DP 650/SP 3000).
    ('F04-33', 'Carousell SG', 'https://www.carousell.sg/toys-collectibles/one-piece-ar-carddass-formation/q-12/', '1445555062', 400.00, 'SGD', 47.00000000, 'LIKE_NEW', 'ACTIVE_LISTING', 'ACCEPTED', 95, 88, 85, 'Raw Film Z Luffy ask observed at S$400; exact printed stats match F04-33.'),
    ('F04-34', 'Carousell SG', 'https://www.carousell.sg/p/zoro-f04-34-one-piece-ar-carddass-1408292241/', '1408292241', 100.00, 'SGD', 47.00000000, 'LIGHT_PLAY', 'ACTIVE_LISTING', 'REVIEW_REQUIRED', 82, 78, 65, 'Direct raw F04-34 Zoro ask at S$100; listing age/condition require continued review.'),
    ('F04-35', 'Carousell SG', 'https://www.carousell.sg/p/nami-f04-35-or-one-piece-ar-carddass-1408291862/', '1408291862', 200.00, 'SGD', 47.00000000, 'LIGHT_PLAY', 'ACTIVE_LISTING', 'ACCEPTED', 74, 84, 80, 'Direct raw F04-35 Nami OR ask at S$200.'),
    ('F04-36', 'Mercari US', 'https://www.mercari.com/us/item/m10039791770/', 'm10039791770', 59.50, 'USD', 60.30000000, 'MODERATE_PLAY', 'ACTIVE_LISTING', 'ACCEPTED', 68, 72, 80, 'Highest exact raw ask found in the re-check: Film Z F04-36 Usopp at US$59.50; condition listed as Good.'),
    ('F04-37', 'Carousell SG', 'https://www.carousell.sg/toys-collectibles/one-piece-ar-carddass/q-12/', '1408292597', 50.00, 'SGD', 47.00000000, 'UNKNOWN', 'ACTIVE_LISTING', 'REVIEW_REQUIRED', 76, 74, 60, 'Highest exact raw ask found in the re-check: F04-37 Sanji at S$50. A separate Mercari JP F04-37 raw ask at JPY1400 was lower.'),
    -- This is a raw, near-mint historical eBay ask. It remains review-required because that listing ended.
    ('F04-38', 'eBay', 'https://www.ebay.com/itm/396127372371', '396127372371', 255.97, 'USD', 60.30000000, 'NEAR_MINT', 'LISTING_ENDED', 'REVIEW_REQUIRED', 60, 82, 55, 'Historical raw F04-38 Chopper near-mint ask at US$255.97. Listing ended; retained as a review-required high reference, not a verified sale.'),
    ('F04-39', 'eBay IE', 'https://www.ebay.ie/sch/i.html?_nkw=One+Piece+Card+AR+Carddass+Nico+Robin+F04-39+OR+Movie+Limited+Ver.', 'ebay-ie-f04-39-or', 260.37, 'EUR', 69.35000000, 'UNKNOWN', 'ACTIVE_LISTING', 'ACCEPTED', 80, 86, 75, 'Raw F04-39 Nico Robin OR ask at EUR260.37; JP Film Z version identified in the listing title.'),
    ('F04-40', 'eBay UK', 'https://www.ebay.co.uk/itm/366372242608', '366372242608', 21.05, 'GBP', 79.50000000, 'NEW', 'ACTIVE_LISTING', 'REVIEW_REQUIRED', 56, 70, 70, 'Highest exact raw F04-40 Franky Film Z ask found in the re-check: GBP21.05 on eBay UK. The listing is marked New.'),
    ('F04-41', 'Mercari JP', 'https://jp.mercari.com/shops/product/2JQmHqFnrdksyV8gdQ95hw', '2JQmHqFnrdksyV8gdQ95hw', 4999.00, 'JPY', 0.39000000, 'UNKNOWN', 'ACTIVE_LISTING', 'REVIEW_REQUIRED', 62, 68, 70, 'Highest exact raw F04-41 Brook Film Z ask found in the re-check: JPY4999 on Mercari JP. This exceeds the lower S$20 damaged Carousell reference and the JPY1400 Mercari JP ask.'),
    ('F04-45', 'eBay UK', 'https://www.ebay.co.uk/str/sunnydaytrading?_pgn=3', 'sunnydaytrading-f04-45-or', 165.55, 'GBP', 79.50000000, 'UNKNOWN', 'ACTIVE_LISTING', 'ACCEPTED', 92, 90, 75, 'Raw F04-45 Monkey D. Luffy Film Z OR ask at GBP165.55.')
), prepared as (
  select
    seed.*,
    round(seed.native_amount * seed.fx_rate) as raw_price_php,
    round((0.06 + ((seed.demand_score - 50) * 0.002)) * 100, 2) as rarity_demand_premium_percent,
    round(seed.native_amount * seed.fx_rate * (1 + 0.06 + ((seed.demand_score - 50) * 0.002))) as published_price_php
  from film_z_price_seed seed
), inserted_events as (
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
    prepared.source_url, prepared.marketplace_listing_id, prepared.event_type,
    now(), now(), now(), prepared.currency, prepared.native_amount,
    prepared.raw_price_php, prepared.fx_rate, now(), prepared.raw_price_php,
    prepared.condition, prepared.source_confidence, prepared.validation_status,
    prepared.source_confidence, 95, prepared.source_confidence,
    prepared.source_confidence, 90,
    'film-z-initial:' || prepared.card_number || ':' || prepared.marketplace_listing_id,
    'film-z-initial:' || prepared.card_number || ':' || prepared.marketplace_listing_id,
    prepared.source_note || ' Initial formula: raw ask * (1 + ' || prepared.rarity_demand_premium_percent || '% OR rarity-and-demand premium).'
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
), initialized_versions as (
  update card_versions versions
  set
    verification_status = 'needs-review',
    pricing_state = 'LIVE',
    initial_reference_price_php = prepared.raw_price_php,
    initial_reference_locked_at = now(),
    current_calculated_price_php = prepared.published_price_php,
    current_published_price_php = prepared.published_price_php,
    high_water_reference_php = prepared.raw_price_php,
    highest_verified_sale_php = null,
    last_market_update_at = now(),
    updated_at = now()
  from prepared
  join cards on cards.card_number = prepared.card_number and cards.catalogue_group = 'Film Z'
  where versions.card_id = cards.id
    and versions.version_code = 'JP'
  returning versions.id, versions.card_id
), seeded_states as (
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
  returning card_id, source_card_version_id
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
    'initialization', 'FILM_Z_RAW_ASK_WITH_OR_RARITY_AND_DEMAND_PREMIUM',
    'rawAskPhp', prepared.raw_price_php,
    'orRarityPremiumPercent', 6,
    'demandScore', prepared.demand_score,
    'demandPremiumPercent', round((prepared.demand_score - 50) * 0.2, 2),
    'totalInitialPremiumPercent', prepared.rarity_demand_premium_percent,
    'sourceConfidence', prepared.source_confidence
  ),
  0, 0, prepared.published_price_php, prepared.published_price_php,
  'LOW', '1.0.0', '1.0.0', now()
from prepared
join cards on cards.card_number = prepared.card_number and cards.catalogue_group = 'Film Z'
join card_versions versions on versions.card_id = cards.id and versions.version_code = 'JP'
on conflict (card_version_id, pricing_period_start, pricing_period_end) do update
set transaction_score = excluded.transaction_score,
    buyer_intent_score = excluded.buyer_intent_score,
    search_demand_score = excluded.search_demand_score,
    scarcity_score = excluded.scarcity_score,
    market_score = excluded.market_score,
    kpi_scores = excluded.kpi_scores,
    calculated_price_php = excluded.calculated_price_php,
    published_price_php = excluded.published_price_php,
    confidence = excluded.confidence,
    calculated_at = now();

-- Verification: should return ten Film Z cards with live prices and explicit
-- demand/scarcity scores. Raw evidence is visible in market_events.
select
  cards.card_number,
  cards.character_name,
  versions.pricing_state,
  versions.initial_reference_price_php as raw_ask_php,
  versions.current_published_price_php as rarity_demand_price_php,
  states.demand_score,
  states.scarcity_score,
  states.confidence,
  versions.last_market_update_at
from cards
join card_versions versions on versions.card_id = cards.id and versions.version_code = 'JP'
left join market_states states on states.card_id = cards.id and states.version = 'JP'
where cards.catalogue_group = 'Film Z'
order by cards.card_number;

commit;
