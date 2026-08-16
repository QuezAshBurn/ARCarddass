-- Product-line support for adding AR Carddass Wanted beside Formation.
-- Existing rows default to Formation so current pricing remains unchanged.

alter table sets
  add column if not exists product_line text not null default 'Formation';

alter table cards
  add column if not exists product_line text not null default 'Formation';

alter table market_states
  add column if not exists product_line text not null default 'Formation';

create index if not exists sets_product_line_idx on sets(product_line);
create index if not exists cards_product_line_idx on cards(product_line);
create index if not exists market_states_product_line_idx on market_states(product_line);

update sets
set product_line = 'Formation'
where product_line is null or product_line = '';

update cards
set product_line = 'Formation'
where product_line is null or product_line = '';

update market_states
set product_line = 'Formation'
where product_line is null or product_line = '';

