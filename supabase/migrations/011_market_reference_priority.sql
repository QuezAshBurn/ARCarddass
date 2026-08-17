-- Market-reference priority metadata.
-- Run this once in the Supabase SQL Editor before deploying the updated cron.
-- It is additive and does not change any existing card price by itself.

begin;

alter table market_events
  add column if not exists is_graded boolean not null default false,
  add column if not exists grader text,
  add column if not exists grade text,
  add column if not exists raw_equivalent_php numeric(12, 2);

alter table market_events
  drop constraint if exists market_events_graded_conversion_check;

alter table market_events
  add constraint market_events_graded_conversion_check
  check (
    (is_graded = false and grader is null and grade is null and raw_equivalent_php is null)
    or
    (is_graded = true)
  );

create index if not exists market_events_reference_priority_idx
  on market_events (card_version_id, validation_status, event_type, event_at desc);

create index if not exists market_events_active_reference_idx
  on market_events (card_version_id, validation_status, discovered_at desc)
  where event_type in ('ACTIVE_LISTING', 'NEW_LISTING');

comment on column market_events.is_graded is
  'True only for professionally graded evidence. Graded evidence is a final pricing fallback.';
comment on column market_events.raw_equivalent_php is
  'Non-graded PHP value derived from documented grader/grade multiplier. Used only when no eligible raw sale or raw ask exists.';

commit;
