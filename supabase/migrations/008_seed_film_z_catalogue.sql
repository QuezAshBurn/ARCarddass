-- One Piece Film Z catalogue group for AR Carddass Formation 04.
-- Run this file in the Supabase SQL Editor after migration 007.
-- It is idempotent and intentionally publishes no market price.

alter table cards
  add column if not exists catalogue_group text,
  add column if not exists card_stats jsonb not null default '{}'::jsonb;

create index if not exists cards_catalogue_group_idx on cards(catalogue_group);

-- Catalogued cards with UNINITIALIZED pricing must be readable so the public
-- site can show the supplied scans and the explicit "Pricing pending" state.
drop policy if exists "public read live card versions" on card_versions;
create policy "public read catalogue card versions" on card_versions
  for select using (pricing_state in ('UNINITIALIZED', 'LIVE', 'FROZEN'));

insert into rarities (code, name, display_order, pricing_tier_default)
values ('OR', 'OR', 6, 1)
on conflict (code) do update
set name = excluded.name,
    display_order = excluded.display_order,
    pricing_tier_default = excluded.pricing_tier_default;

insert into sets (code, name, display_order, status, product_line)
values ('F04', 'King Rare 04', 4, 'active', 'Formation')
on conflict (code) do nothing;

with film_z_seed (
  card_number, printed_number, character_name, rarity_code, category,
  front_image_path, summary, accent_a, accent_b, card_stats
) as (
  values
    ('F04-33', 'NO.F04-33', 'Monkey D. Luffy', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-33-luffy.jpg', 'Film Z Luffy in a red film outfit. Catalogued from the supplied scan; raw-market evidence is pending.', '#dc2626', '#7f1d1d', '{"hp":4300,"ap":650,"dp":650,"sp":3000}'::jsonb),
    ('F04-34', 'NO.F04-34', 'Roronoa Zoro', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-34-zoro.jpg', 'Film Z Zoro with swords drawn. Catalogued from the supplied scan; raw-market evidence is pending.', '#dc2626', '#14532d', '{"hp":4200,"ap":700,"dp":640,"sp":2500}'::jsonb),
    ('F04-35', 'NO.F04-35', 'Nami', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-35-nami.jpg', 'Film Z Nami in an adventure outfit. Catalogued from the supplied scan; raw-market evidence is pending.', '#f59e0b', '#0f4c81', '{"hp":3900,"ap":600,"dp":740,"sp":3000}'::jsonb),
    ('F04-36', 'NO.F04-36', 'Usopp', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-36-usopp.jpg', 'Film Z Usopp in a pirate-themed action pose. Catalogued from the supplied scan; raw-market evidence is pending.', '#f97316', '#7f1d1d', '{"hp":4000,"ap":680,"dp":620,"sp":2300}'::jsonb),
    ('F04-37', 'NO.F04-37', 'Sanji', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-37-sanji.jpg', 'Film Z Sanji with a pistol motif and Japanese quote artwork. Catalogued from the supplied scan; raw-market evidence is pending.', '#a855f7', '#111827', '{"hp":4300,"ap":640,"dp":700,"sp":2500}'::jsonb),
    ('F04-38', 'NO.F04-38', 'Tony Tony Chopper', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-38-chopper.jpg', 'Film Z Chopper in a close-up pirate costume design. Catalogued from the supplied scan; raw-market evidence is pending.', '#ef4444', '#0f4c81', '{"hp":4200,"ap":670,"dp":660,"sp":2400}'::jsonb),
    ('F04-39', 'NO.F04-39', 'Nico Robin', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-39-nico-robin.jpg', 'Film Z Robin in a cowgirl-styled outfit. Catalogued from the supplied scan; raw-market evidence is pending.', '#9333ea', '#14532d', '{"hp":4300,"ap":650,"dp":640,"sp":2800}'::jsonb),
    ('F04-40', 'NO.F04-40', 'Franky', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-40-franky.jpg', 'Film Z Franky with the Thousand Sunny cannon backdrop. Catalogued from the supplied scan; raw-market evidence is pending.', '#0ea5e9', '#f97316', '{"hp":4300,"ap":670,"dp":670,"sp":2000}'::jsonb),
    ('F04-41', 'NO.F04-41', 'Brook', 'OR', 'One Piece Film Z official rare', '/assets/card-scans/film-z/f04-41-brook.jpg', 'Film Z Brook with bright music-themed artwork. Catalogued from the supplied scan; raw-market evidence is pending.', '#38bdf8', '#a855f7', '{"hp":4200,"ap":640,"dp":680,"sp":2300}'::jsonb),
    ('F04-45', 'NO.F04-45', 'Straw Hat Crew', 'OR', 'One Piece Film Z group official rare', '/assets/card-scans/film-z/f04-45-straw-hat-crew.jpg', 'One Piece Film Z Straw Hat Crew group card. Catalogued from the supplied scan; raw-market evidence is pending.', '#f59e0b', '#dc2626', '{"hp":3900,"ap":670,"dp":670,"sp":3400}'::jsonb)
)
insert into cards (
  card_number, printed_number, character_name, set_id, rarity_id, category,
  pricing_tier, pricing_enabled, catalogue_status, front_image_path, product_line,
  catalogue_group, summary, accent_a, accent_b, card_stats
)
select
  seed.card_number, seed.printed_number, seed.character_name, sets.id, rarities.id,
  seed.category, 1, true, 'seeded', seed.front_image_path, 'Formation', 'Film Z',
  seed.summary, seed.accent_a, seed.accent_b, seed.card_stats
from film_z_seed seed
join sets on sets.code = 'F04'
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
    catalogue_group = excluded.catalogue_group,
    summary = excluded.summary,
    accent_a = excluded.accent_a,
    accent_b = excluded.accent_b,
    card_stats = excluded.card_stats,
    updated_at = now();

insert into card_versions (
  card_id, version_code, language, region, verification_status, pricing_state
)
select cards.id, 'JP', 'Japanese', 'Japan', 'needs-review', 'UNINITIALIZED'
from cards
where cards.catalogue_group = 'Film Z'
on conflict (card_id, version_code) do update
set language = excluded.language,
    region = excluded.region,
    verification_status = excluded.verification_status,
    pricing_state = 'UNINITIALIZED',
    initial_reference_price_php = null,
    initial_reference_locked_at = null,
    current_calculated_price_php = null,
    current_published_price_php = null,
    high_water_reference_php = null,
    highest_verified_sale_php = null,
    last_market_update_at = null,
    updated_at = now();

-- Verification: the query should return ten Film Z cards, all pending price research.
select c.card_number, c.character_name, r.code as rarity, cv.pricing_state, c.card_stats
from cards c
join rarities r on r.id = c.rarity_id
join card_versions cv on cv.card_id = c.id and cv.version_code = 'JP'
where c.catalogue_group = 'Film Z'
order by c.card_number;
