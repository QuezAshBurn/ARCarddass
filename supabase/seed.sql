insert into sets (code, name, display_order)
values
  ('F01', 'One Piece AR Carddass Formation 01', 1),
  ('F02', 'One Piece AR Carddass Formation 02', 2),
  ('F03', 'One Piece AR Carddass Formation 03', 3),
  ('F04', 'One Piece AR Carddass Formation 04', 4)
on conflict (code) do nothing;

insert into rarities (code, name, display_order, pricing_tier_default)
values
  ('KR', 'King Rare', 1, 1),
  ('SKR', 'Secret King Rare', 2, 1)
on conflict (code) do nothing;

insert into cards (card_number, character_name, set_id, rarity_id, category, pricing_tier, pricing_enabled, catalogue_status)
select card_number, character_name, sets.id, rarities.id, 'Premium character', 1, true, 'seeded'
from (
  values
    ('F01-01', 'Monkey D. Luffy', 'F01', 'KR'),
    ('F01-37', 'Portgas D. Ace', 'F01', 'KR'),
    ('F02-20', 'Boa Hancock', 'F02', 'KR'),
    ('F02-24', 'Crocodile', 'F02', 'KR'),
    ('F03-03', 'Roronoa Zoro', 'F03', 'KR'),
    ('F03-13', 'Sanji', 'F03', 'KR'),
    ('F04-13', 'Rob Lucci', 'F04', 'KR'),
    ('F04-27', 'Sogeking', 'F04', 'SKR')
) as seed(card_number, character_name, set_code, rarity_code)
join sets on sets.code = seed.set_code
join rarities on rarities.code = seed.rarity_code
on conflict (card_number) do nothing;

insert into card_versions (card_id, version_code, language, region, verification_status, pricing_state)
select cards.id, version_code, language, region, 'confirmed', 'UNINITIALIZED'
from cards
cross join (
  values
    ('JP', 'Japanese', 'Japan'),
    ('EN', 'English', 'International'),
    ('HK', 'Chinese', 'CN / TW / HK')
) as versions(version_code, language, region)
on conflict (card_id, version_code) do nothing;

with seed_current_prices(card_number, jp_price_php) as (
  values
    ('F01-01', 194000),
    ('F01-37', 86500),
    ('F02-20', 160000),
    ('F02-24', 60000),
    ('F03-03', 150000),
    ('F03-13', 83500),
    ('F04-13', 110000),
    ('F04-27', 128000)
), version_prices as (
  select
    cards.id as card_id,
    versions.version_code,
    case
      when versions.version_code = 'JP' then seed_current_prices.jp_price_php
      when versions.version_code = 'EN' then round(seed_current_prices.jp_price_php * 0.90)
      when versions.version_code = 'HK' then round(seed_current_prices.jp_price_php * 0.85)
    end as published_price_php
  from seed_current_prices
  join cards on cards.card_number = seed_current_prices.card_number
  cross join (
    values ('JP'), ('EN'), ('HK')
  ) as versions(version_code)
)
update card_versions
set
  pricing_state = 'LIVE',
  initial_reference_price_php = round(version_prices.published_price_php * 0.93),
  initial_reference_locked_at = coalesce(card_versions.initial_reference_locked_at, now()),
  current_calculated_price_php = version_prices.published_price_php,
  current_published_price_php = version_prices.published_price_php,
  high_water_reference_php = round(version_prices.published_price_php * 1.08),
  highest_verified_sale_php = round(version_prices.published_price_php * 1.02),
  last_market_update_at = now(),
  updated_at = now()
from version_prices
where
  card_versions.card_id = version_prices.card_id
  and card_versions.version_code = version_prices.version_code;