-- Merge Chinese regional releases into one HK display/version bucket.
-- CN, TW, and HK refer to the same card version for AR Carddass Formation pricing.

create temporary table chinese_version_duplicates on commit drop as
select old_versions.id as old_id, hk_versions.id as hk_id
from card_versions old_versions
join card_versions hk_versions
  on hk_versions.card_id = old_versions.card_id
 and hk_versions.version_code = 'HK'
where old_versions.version_code in ('CN', 'TW');

update price_snapshots
set card_version_id = chinese_version_duplicates.hk_id
from chinese_version_duplicates
where price_snapshots.card_version_id = chinese_version_duplicates.old_id
  and not exists (
    select 1
    from price_snapshots existing
    where existing.card_version_id = chinese_version_duplicates.hk_id
      and existing.pricing_period_start = price_snapshots.pricing_period_start
      and existing.pricing_period_end = price_snapshots.pricing_period_end
  );

delete from price_snapshots
using chinese_version_duplicates
where price_snapshots.card_version_id = chinese_version_duplicates.old_id;

delete from card_versions
using chinese_version_duplicates
where card_versions.id = chinese_version_duplicates.old_id;

update card_versions
set
  version_code = 'HK',
  language = 'Chinese',
  region = 'CN / TW / HK',
  updated_at = now()
where version_code in ('CN', 'TW');

update card_versions
set
  language = 'Chinese',
  region = 'CN / TW / HK',
  updated_at = now()
where version_code = 'HK';