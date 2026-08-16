-- Supabase is the only source of truth for Wanted catalogue and live prices.
-- Run this complete file once in the Supabase SQL Editor. It is safe to run again.

alter table cards
  add column if not exists printed_number text,
  add column if not exists summary text,
  add column if not exists accent_a text,
  add column if not exists accent_b text,
  add column if not exists research_pricing_source text,
  add column if not exists research_pricing_url text,
  add column if not exists research_pricing_confidence text;

alter table market_states
  add column if not exists demand_score integer not null default 0,
  add column if not exists scarcity_score integer not null default 0,
  add column if not exists direct_evidence_count integer not null default 0,
  add column if not exists modeled_evidence_count integer not null default 0;

create or replace function seed_wanted_catalogue()
returns void
language plpgsql
as $$
begin
  insert into rarities (code, name, display_order, pricing_tier_default)
  values
    ('R', 'Rare', 3, 1),
    ('UC', 'Uncommon', 4, 1),
    ('C', 'Common', 5, 1)
  on conflict (code) do update
  set name = excluded.name,
      display_order = excluded.display_order,
      pricing_tier_default = excluded.pricing_tier_default;

  insert into sets (code, name, display_order, status, product_line)
  values
    ('W01', 'Wanted 01', 101, 'active', 'Wanted'),
    ('W02', 'Wanted 02', 102, 'active', 'Wanted'),
    ('W03', 'Wanted 03', 103, 'active', 'Wanted'),
    ('W04', 'Wanted 04', 104, 'active', 'Wanted')
  on conflict (code) do update
  set name = excluded.name,
      display_order = excluded.display_order,
      status = excluded.status,
      product_line = excluded.product_line;

  with wanted_seed (
    card_number, printed_number, character_name, set_code, rarity_code, category,
    front_image_path, summary, accent_a, accent_b, research_pricing_source,
    research_pricing_url, research_pricing_confidence
  ) as (
    values
      ('W01-05', 'NO.01-05', 'Roronoa Zoro', 'W01', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w01-05-zoro.png', 'Core Straw Hat character with direct high-ask evidence and steady collector demand.', '#16a34a', '#0f5132', 'Observed eBay raw asking reference.', 'https://www.ebay.com/sch/i.html?_nkw=2011+One+Piece+AR+Carddass+Zoro+Wanted+No.+01-05', 'Observed listing'),
      ('W01-10', 'NO.01-10', 'Sanji', 'W01', 'UC', 'Wanted poster character', '/assets/card-scans/wanted/w01-10-sanji.png', 'Uncommon Straw Hat card with thin public raw-market coverage.', '#facc15', '#1f2937', 'Mercari JP raw-market research; review required.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%B5%E3%83%B3%E3%82%B8%2001-10', 'Needs review'),
      ('W01-12', 'NO.01-12', 'Tony Tony Chopper', 'W01', 'UC', 'Wanted poster character', '/assets/card-scans/wanted/w01-12-chopper.png', 'Raw-market asks take priority; graded conversion is fallback-only.', '#f97316', '#ef4444', 'Raw marketplace ask with graded fallback recorded separately.', 'https://www.ebay.com/sch/i.html?_nkw=one+piece+AR+carddass+wanted+poster+chopper+01-12', 'Observed listing'),
      ('W01-27', 'NO.01-27', 'Boa Hancock', 'W01', 'R', 'Rare Wanted poster character', '/assets/card-scans/wanted/w01-27-boa-hancock.png', 'Rare Boa Hancock card with strong active-listing evidence.', '#ec4899', '#7c3aed', 'Observed active listing and Mercari research.', 'https://www.ebay.com/itm/800456598933', 'Observed listing'),
      ('W01-36', 'NO.01-36', 'Eustass Kid', 'W01', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w01-36-kidd.png', 'Limited exact high-ask evidence; held for marketplace verification.', '#dc2626', '#6d28d9', 'Related marketplace listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%AD%E3%83%83%E3%83%89', 'Needs review'),
      ('W01-39', 'NO.01-39', 'Trafalgar Law', 'W01', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w01-39-law.png', 'Popular character with thin exact raw-market evidence.', '#06b6d4', '#1e3a8a', 'Mercari JP research; review required.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%AD%E3%83%BC%2001-39', 'Needs review'),
      ('W02-02', 'NO.02-02', 'Monkey D. Luffy', 'W02', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w02-02-luffy.png', 'Main-character demand; raw marketplace price is used before any graded conversion.', '#ef4444', '#f59e0b', 'Collector-provided eBay active raw ask: US$303.', 'https://www.ebay.com/itm/278201455485', 'Observed listing'),
      ('W02-08', 'NO.02-08', 'Nami', 'W02', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w02-08-nami.png', 'Raw marketplace ask is preferred over a PSA 10 converted value.', '#fb923c', '#0ea5e9', 'Raw marketplace research with PSA fallback only.', 'https://www.ebay.com/sch/i.html?_nkw=One+Piece+Nami+Card+AR+Carddass+F+Second+Formation+Rare+02-08+PSA+10', 'Observed listing'),
      ('W02-16', 'NO.02-16', 'Nico Robin', 'W02', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w02-16-robin.png', 'Raw-market floor retained while stronger exact evidence is collected.', '#7c3aed', '#1e1b4b', 'Mercari JP raw-market research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%AD%E3%83%93%E3%83%B3%2002-16', 'Observed listing'),
      ('W02-18', 'NO.02-18', 'Franky', 'W02', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w02-18-franky.png', 'Direct exact pricing remains thin and requires review.', '#06b6d4', '#f97316', 'Related marketplace listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%95%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%BC', 'Needs review'),
      ('W02-22', 'NO.02-22', 'Buggy', 'W02', 'UC', 'Wanted poster character', '/assets/card-scans/wanted/w02-22-buggy.png', 'Observed raw eBay ask; graded references remain fallback-only.', '#8b5cf6', '#ef4444', 'Observed eBay raw asking reference.', 'https://www.ebay.com/sch/i.html?_nkw=One+Piece+AR+Carddass+Buggy+02-22', 'Observed listing'),
      ('W02-24', 'NO.02-24', 'Portgas D. Ace', 'W02', 'UC', 'Wanted poster character', '/assets/card-scans/wanted/w02-24-ace.png', 'Direct raw-market research with strong character demand.', '#f97316', '#dc2626', 'Mercari JP exact listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%A8%E3%83%BC%E3%82%B9%2002-24', 'Observed listing'),
      ('W02-31', 'NO.02-31', 'Edward Newgate', 'W02', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w02-31-whitebeard.png', 'Exact high asks are thin; price remains marked for review.', '#94a3b8', '#0f172a', 'Related marketplace listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E7%99%BD%E3%81%B2%E3%81%92%2002-31', 'Needs review'),
      ('W02-35', 'NO.02-35', 'Silvers Rayleigh', 'W02', 'R', 'Rare Wanted poster character', '/assets/card-scans/wanted/w02-35-rayleigh.png', 'Rare card with direct public high-ask reference.', '#d1d5db', '#a16207', 'Observed eBay raw asking reference.', 'https://www.ebay.com/sch/i.html?_nkw=One+Piece+Card+AR+Carddass+Second+Formation+02+No.35+SILVERS+RAYLEIGH', 'Observed listing'),
      ('W03-12', 'NO.03-12', 'Usopp', 'W03', 'UC', 'Wanted poster character', '/assets/card-scans/wanted/w03-12-usopp.png', 'Raw market pricing remains preferred over graded-to-raw fallback signals.', '#f59e0b', '#7c2d12', 'Raw-market floor; graded fallback recorded separately.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%A6%E3%82%BD%E3%83%83%E3%83%97%2003-12', 'Needs review'),
      ('W03-28', 'NO.03-28', 'Brook', 'W03', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w03-28-brook.png', 'Common Wanted card with limited public high asks.', '#f97316', '#111827', 'Related marketplace listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%96%E3%83%AB%E3%83%83%E3%82%AF%2003-28', 'Needs review'),
      ('W03-51', 'NO.03-51', 'Caribou', 'W03', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w03-51-caribou.png', 'Sparse public listings; held at a review-required reference.', '#84cc16', '#14532d', 'Related marketplace listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%AB%E3%83%AA%E3%83%96%E3%83%BC%2003-51', 'Needs review'),
      ('W04-29', 'NO.04-29', 'Dracule Mihawk', 'W04', 'R', 'Rare Wanted poster character', '/assets/card-scans/wanted/w04-29-mihawk.jpg', 'High-SP Mihawk card; exact listing confirmation remains pending.', '#111827', '#dc2626', 'Related Mercari Mihawk listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%83%9F%E3%83%9B%E3%83%BC%E3%82%AF%2004-29', 'Needs review'),
      ('W04-44', 'NO.04-44', 'Jinbei', 'W04', 'C', 'Wanted poster character', '/assets/card-scans/wanted/w04-44-jinbei.png', 'Common Wanted 04 card with moderate scarcity and thin exact evidence.', '#0ea5e9', '#1e40af', 'Related marketplace listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%B8%E3%83%B3%E3%83%99%E3%82%A8%2004-44', 'Needs review'),
      ('W04-60', 'NO.04-60', 'Shanks', 'W04', 'UC', 'Wanted poster character', '/assets/card-scans/wanted/w04-60-shanks.png', 'Related high asks better reflect demand; exact pricing needs confirmation.', '#dc2626', '#1e293b', 'Related Mercari Shanks listing research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%B7%E3%83%A3%E3%83%B3%E3%82%AF%E3%82%B9%2004-60', 'Needs review'),
      ('W04-ARLONG', 'NO.04-??', 'Arlong', 'W04', 'UC', 'Wanted poster character', '/assets/card-scans/wanted/w04-arlong.png', 'Card number is unconfirmed and the reference remains review-required.', '#22c55e', '#1d4ed8', 'Scan and related-marketplace research.', 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%20AR%E3%82%AB%E3%83%BC%E3%83%89%E3%83%80%E3%82%B9%20%E3%82%A2%E3%83%BC%E3%83%AD%E3%83%B3', 'Needs review')
  )
  insert into cards (
    card_number, printed_number, character_name, set_id, rarity_id, category,
    pricing_tier, pricing_enabled, catalogue_status, front_image_path, product_line,
    summary, accent_a, accent_b, research_pricing_source, research_pricing_url,
    research_pricing_confidence
  )
  select
    seed.card_number, seed.printed_number, seed.character_name, sets.id, rarities.id,
    seed.category, 1, true, 'live', seed.front_image_path, 'Wanted', seed.summary,
    seed.accent_a, seed.accent_b, seed.research_pricing_source,
    seed.research_pricing_url, seed.research_pricing_confidence
  from wanted_seed seed
  join sets on sets.code = seed.set_code
  join rarities on rarities.code = seed.rarity_code
  on conflict (card_number) do update
  set printed_number = excluded.printed_number,
      character_name = excluded.character_name,
      set_id = excluded.set_id,
      rarity_id = excluded.rarity_id,
      category = excluded.category,
      pricing_tier = excluded.pricing_tier,
      pricing_enabled = excluded.pricing_enabled,
      catalogue_status = excluded.catalogue_status,
      front_image_path = excluded.front_image_path,
      product_line = excluded.product_line,
      summary = excluded.summary,
      accent_a = excluded.accent_a,
      accent_b = excluded.accent_b,
      research_pricing_source = excluded.research_pricing_source,
      research_pricing_url = excluded.research_pricing_url,
      research_pricing_confidence = excluded.research_pricing_confidence,
      updated_at = now();

  with wanted_price_seed (
    card_number, price_php, demand_score, scarcity_score, direct_evidence_count,
    modeled_evidence_count, verification_status
  ) as (
    values
      ('W01-05', 7400, 82, 64, 1, 2, 'confirmed'),
      ('W01-10', 4500, 72, 58, 0, 4, 'needs-review'),
      ('W01-12', 3100, 68, 54, 1, 2, 'confirmed'),
      ('W01-27', 43300, 84, 72, 1, 2, 'confirmed'),
      ('W01-36', 5600, 58, 45, 0, 4, 'needs-review'),
      ('W01-39', 2500, 78, 52, 0, 4, 'needs-review'),
      ('W02-02', 18571, 90, 66, 1, 2, 'confirmed'),
      ('W02-08', 9200, 80, 60, 1, 2, 'confirmed'),
      ('W02-16', 2700, 70, 48, 1, 2, 'confirmed'),
      ('W02-18', 3500, 50, 42, 0, 4, 'needs-review'),
      ('W02-22', 7354, 64, 58, 1, 2, 'confirmed'),
      ('W02-24', 7700, 86, 60, 1, 2, 'confirmed'),
      ('W02-31', 2500, 72, 50, 0, 4, 'needs-review'),
      ('W02-35', 12300, 82, 78, 1, 2, 'confirmed'),
      ('W03-12', 4800, 62, 58, 0, 4, 'needs-review'),
      ('W03-28', 2000, 54, 45, 0, 4, 'needs-review'),
      ('W03-51', 1800, 35, 42, 0, 4, 'needs-review'),
      ('W04-29', 12200, 84, 76, 0, 4, 'needs-review'),
      ('W04-44', 2200, 52, 50, 0, 4, 'needs-review'),
      ('W04-60', 3500, 82, 48, 0, 4, 'needs-review'),
      ('W04-ARLONG', 4300, 48, 56, 0, 4, 'needs-review')
  )
  insert into card_versions (
    card_id, version_code, language, region, verification_status, pricing_state,
    initial_reference_price_php, initial_reference_locked_at,
    current_calculated_price_php, current_published_price_php,
    high_water_reference_php, highest_verified_sale_php, last_market_update_at
  )
  select
    cards.id, 'JP', 'Japanese', 'Japan', seed.verification_status, 'LIVE',
    seed.price_php, now(), seed.price_php, seed.price_php, seed.price_php, 0, now()
  from wanted_price_seed seed
  join cards on cards.card_number = seed.card_number and cards.product_line = 'Wanted'
  on conflict (card_id, version_code) do update
  set language = excluded.language,
      region = excluded.region,
      verification_status = excluded.verification_status,
      pricing_state = excluded.pricing_state,
      updated_at = now();

  with wanted_kpis (
    card_number, demand_score, scarcity_score, direct_evidence_count, modeled_evidence_count
  ) as (
    values
      ('W01-05', 82, 64, 1, 2), ('W01-10', 72, 58, 0, 4), ('W01-12', 68, 54, 1, 2),
      ('W01-27', 84, 72, 1, 2), ('W01-36', 58, 45, 0, 4), ('W01-39', 78, 52, 0, 4),
      ('W02-02', 90, 66, 1, 2), ('W02-08', 80, 60, 1, 2), ('W02-16', 70, 48, 1, 2),
      ('W02-18', 50, 42, 0, 4), ('W02-22', 64, 58, 1, 2), ('W02-24', 86, 60, 1, 2),
      ('W02-31', 72, 50, 0, 4), ('W02-35', 82, 78, 1, 2), ('W03-12', 62, 58, 0, 4),
      ('W03-28', 54, 45, 0, 4), ('W03-51', 35, 42, 0, 4), ('W04-29', 84, 76, 0, 4),
      ('W04-44', 52, 50, 0, 4), ('W04-60', 82, 48, 0, 4), ('W04-ARLONG', 48, 56, 0, 4)
  )
  insert into market_states (
    card_id, card_code, card_name, rarity, version, product_line,
    initial_reference_price_php, previous_published_price_php, calculated_price_php,
    published_price_php, confidence, last_evidence_check_at, last_calculated_at,
    last_published_at, source_card_version_id, demand_score, scarcity_score,
    direct_evidence_count, modeled_evidence_count
  )
  select
    cards.id, cards.card_number, cards.character_name, rarities.code, versions.version_code,
    'Wanted', versions.initial_reference_price_php, versions.current_published_price_php,
    versions.current_calculated_price_php, versions.current_published_price_php,
    case when versions.verification_status = 'confirmed' then 'MODERATE' else 'LOW' end,
    now(), now(), now(), versions.id, seed.demand_score, seed.scarcity_score,
    seed.direct_evidence_count, seed.modeled_evidence_count
  from wanted_kpis seed
  join cards on cards.card_number = seed.card_number and cards.product_line = 'Wanted'
  join rarities on rarities.id = cards.rarity_id
  join card_versions versions on versions.card_id = cards.id and versions.version_code = 'JP'
  on conflict (card_id, version) do update
  set card_code = excluded.card_code,
      card_name = excluded.card_name,
      rarity = excluded.rarity,
      product_line = excluded.product_line,
      demand_score = excluded.demand_score,
      scarcity_score = excluded.scarcity_score,
      direct_evidence_count = excluded.direct_evidence_count,
      modeled_evidence_count = excluded.modeled_evidence_count,
      updated_at = now();
end;
$$;

select seed_wanted_catalogue();
drop function seed_wanted_catalogue();
