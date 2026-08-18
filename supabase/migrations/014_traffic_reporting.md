# Traffic reporting database setup

Copy **only** the SQL below into the Supabase SQL Editor, then select **Run**.

```sql
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
```

Then, in Vercel → Project → Settings → Environment Variables, add a secret value for:

```text
TRAFFIC_REPORT_TOKEN
```

Keep the existing `SUPABASE_SERVICE_ROLE_KEY` configured. After deploying, open:

```text
https://arcarddass.vercel.app/admin/traffic?token=YOUR_TRAFFIC_REPORT_TOKEN
```

Traffic collection starts after deployment; it cannot backfill visits from before the tracker existed.
