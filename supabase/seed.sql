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
    ('CN', 'Chinese', 'Greater China')
) as versions(version_code, language, region)
on conflict (card_id, version_code) do nothing;
