-- Documented graded-sale proof for King Rare F03-03 Roronoa Zoro.
--
-- The supplied eBay capture says "Sold Aug 13, 2026" and shows PHP184,347
-- followed by "or Best Offer". Since eBay can withhold the final accepted
-- offer, this remains REVIEW_REQUIRED: it is public proof, but it cannot
-- automatically change the raw Market Index until the exact paid amount is verified.

begin;

with target as (
  select
    cards.id as card_id,
    card_versions.id as card_version_id,
    card_versions.version_code
  from cards
  join card_versions on card_versions.card_id = cards.id
  where cards.card_number = 'F03-03'
    and cards.product_line = 'Formation'
    and card_versions.version_code = 'JP'
  limit 1
)
insert into market_events (
  card_id,
  card_version_id,
  card_code,
  version,
  marketplace,
  source_url,
  marketplace_listing_id,
  event_type,
  event_at,
  discovered_at,
  currency,
  native_amount,
  php_amount,
  fx_rate,
  listing_price,
  condition,
  validation_status,
  condition_confidence,
  seller_confidence,
  version_confidence,
  comparability_confidence,
  evidence_confidence,
  independence_confidence,
  is_graded,
  grader,
  grade,
  raw_equivalent_php,
  duplicate_fingerprint,
  idempotency_key,
  notes
)
select
  target.card_id,
  target.card_version_id,
  'F03-03',
  target.version_code,
  'eBay',
  'https://www.ebay.com/sch/i.html?_nkw=2012+one+piece+ar+carddass+formation+03+zoro+psa+9&LH_Complete=1&LH_Sold=1',
  'user-proof-f03-03-psa9-2026-08-13',
  'VERIFIED_SALE',
  '2026-08-13T12:00:00+08:00'::timestamptz,
  now(),
  'PHP',
  184347.00,
  184347.00,
  1.00000000,
  184347.00,
  'NEW',
  'REVIEW_REQUIRED',
  90,
  80,
  98,
  95,
  82,
  90,
  true,
  'PSA',
  '9',
  131676.00,
  'user-proof:f03-03:psa9:2026-08-13',
  'user-proof:f03-03:psa9:2026-08-13',
  'User-supplied eBay transaction capture. The page reports Sold Aug 13, 2026 and displays PHP184,347 "or Best Offer" for 2012 One Piece AR Carddass Formation 03 #03 Roronoa Zoro PSA 9. The exact negotiated offer is not disclosed, so this record is public evidence but REVIEW_REQUIRED and excluded from automatic raw-price selection. Raw equivalent shown at PSA 9 multiplier ÷ 1.40.'
from target
on conflict (duplicate_fingerprint) do update
set
  source_url = excluded.source_url,
  event_at = excluded.event_at,
  native_amount = excluded.native_amount,
  php_amount = excluded.php_amount,
  listing_price = excluded.listing_price,
  raw_equivalent_php = excluded.raw_equivalent_php,
  validation_status = excluded.validation_status,
  notes = excluded.notes,
  updated_at = now();

commit;
