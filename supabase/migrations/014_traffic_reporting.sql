-- First-party traffic reporting for the AR Carddass admin dashboard.
-- Stores a pseudonymous visitor ID and coarse Vercel geo headers only.
-- It intentionally never stores an IP address or user-agent string.

create table if not exists traffic_visits (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  visitor_id uuid not null,
  path text not null check (path like '/%'),
  country text,
  region text,
  city text
);

create index if not exists traffic_visits_occurred_at_idx
  on traffic_visits (occurred_at desc);

create index if not exists traffic_visits_country_occurred_at_idx
  on traffic_visits (country, occurred_at desc);

alter table traffic_visits enable row level security;

-- No public policies: inserts and reports use the server-side Supabase service key only.
