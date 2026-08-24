create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'blog_post_status') then
    create type blog_post_status as enum ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
  end if;
end $$;

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content_markdown text not null,
  status blog_post_status not null default 'DRAFT',
  category text not null,
  author text not null default 'AR Carddass Research Desk',
  hero_image text,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  tags text[] not null default '{}',
  related_card_codes text[] not null default '{}',
  related_set_codes text[] not null default '{}',
  related_evidence_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_status_publish_check check (
    status <> 'PUBLISHED' or published_at is not null
  )
);

create index if not exists blog_posts_status_published_at_idx
  on blog_posts (status, published_at desc);

create index if not exists blog_posts_category_idx
  on blog_posts (category);

create index if not exists blog_posts_related_card_codes_idx
  on blog_posts using gin (related_card_codes);

create index if not exists blog_posts_related_set_codes_idx
  on blog_posts using gin (related_set_codes);

alter table blog_posts enable row level security;

drop policy if exists "public read published blog posts" on blog_posts;
create policy "public read published blog posts" on blog_posts
  for select using (status = 'PUBLISHED');

insert into blog_posts (
  slug,
  title,
  excerpt,
  content_markdown,
  status,
  category,
  author,
  published_at,
  seo_title,
  seo_description,
  tags,
  related_card_codes,
  related_set_codes,
  related_evidence_ids
) values
  (
    'how-ar-carddass-market-prices-are-calculated',
    'How AR Carddass Market Prices Are Calculated',
    'A plain-language guide to verified sales, asking references, graded-to-raw conversion, and evidence guardrails.',
    '## Pricing source of truth

Current prices come from market state and card version records, not from blog text.

## Evidence priority

1. Highest verified sold reference from the recent market window.
2. If no sale exists, the highest active asking reference.
3. If no raw reference exists, a graded card may be converted into a raw equivalent using the configured grading matrix.

## Guardrails

Active listings are not completed sales. Review-required events can be shown as evidence, but they do not automatically move the public Market Index.',
    'PUBLISHED',
    'Collector Guide',
    'AR Carddass Research Desk',
    now(),
    'How One Piece AR Carddass Market Prices Are Calculated',
    'Learn how AR Carddass prices use verified sales, asking references, graded-to-raw conversion, and evidence guardrails.',
    array['pricing', 'market-state', 'evidence'],
    array[]::text[],
    array['F01', 'F02', 'F03', 'F04'],
    array[]::text[]
  ),
  (
    'what-is-one-piece-ar-carddass-formation',
    'What Is One Piece AR Carddass Formation?',
    'A collector introduction to AR Carddass Formation identification, rarity, version research, and market evidence.',
    '## Draft status

This introduction is staged for review. Publish only once catalogue facts are checked against the live card database and evidence ledger.',
    'DRAFT',
    'Collector Guide',
    'AR Carddass Research Desk',
    null,
    'What Is One Piece AR Carddass Formation?',
    'Collector guide draft for One Piece AR Carddass Formation.',
    array['formation', 'collector-guide'],
    array[]::text[],
    array['F01', 'F02', 'F03', 'F04'],
    array[]::text[]
  ),
  (
    'ar-carddass-formation-01-guide',
    'AR Carddass Formation 01 Guide',
    'Checklist, rarity notes, and market highlights for Formation 01.',
    '## Draft status

This set guide is generated from the live catalogue, but release notes and variant notes still need collector review before publication.',
    'DRAFT',
    'Set Guide',
    'AR Carddass Research Desk',
    null,
    'One Piece AR Carddass Formation 01 Checklist and Card Guide',
    'Draft set guide for One Piece AR Carddass Formation 01.',
    array['set-guide', 'f01'],
    array[]::text[],
    array['F01'],
    array[]::text[]
  ),
  (
    'ar-carddass-formation-02-guide',
    'AR Carddass Formation 02 Guide',
    'Checklist, rarity notes, and market highlights for Formation 02.',
    '## Draft status

This set guide is generated from the live catalogue, but release notes and variant notes still need collector review before publication.',
    'DRAFT',
    'Set Guide',
    'AR Carddass Research Desk',
    null,
    'One Piece AR Carddass Formation 02 Checklist and Card Guide',
    'Draft set guide for One Piece AR Carddass Formation 02.',
    array['set-guide', 'f02'],
    array[]::text[],
    array['F02'],
    array[]::text[]
  ),
  (
    'ar-carddass-formation-03-guide',
    'AR Carddass Formation 03 Guide',
    'Checklist, rarity notes, and market highlights for Formation 03.',
    '## Draft status

This set guide is generated from the live catalogue, but release notes and variant notes still need collector review before publication.',
    'DRAFT',
    'Set Guide',
    'AR Carddass Research Desk',
    null,
    'One Piece AR Carddass Formation 03 Checklist and Card Guide',
    'Draft set guide for One Piece AR Carddass Formation 03.',
    array['set-guide', 'f03'],
    array[]::text[],
    array['F03'],
    array[]::text[]
  ),
  (
    'ar-carddass-formation-04-guide',
    'AR Carddass Formation 04 Guide',
    'Checklist, rarity notes, and market highlights for Formation 04.',
    '## Draft status

This set guide is generated from the live catalogue, but release notes and variant notes still need collector review before publication.',
    'DRAFT',
    'Set Guide',
    'AR Carddass Research Desk',
    null,
    'One Piece AR Carddass Formation 04 Checklist and Card Guide',
    'Draft set guide for One Piece AR Carddass Formation 04.',
    array['set-guide', 'f04'],
    array[]::text[],
    array['F04'],
    array[]::text[]
  ),
  (
    'kr-vs-skr-understanding-ar-carddass-rarities',
    'KR vs SKR: Understanding AR Carddass Rarities',
    'A review draft for rarity labels used by the Formation catalogue.',
    '## Draft status

This rarity guide is staged until the full rarity ladder is validated against the catalogue.',
    'DRAFT',
    'Collector Guide',
    'AR Carddass Research Desk',
    null,
    'KR vs SKR: Understanding AR Carddass Rarities',
    'Draft rarity guide for One Piece AR Carddass Formation.',
    array['rarity', 'kr', 'skr'],
    array[]::text[],
    array['F01', 'F02', 'F03', 'F04'],
    array[]::text[]
  )
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content_markdown = excluded.content_markdown,
  category = excluded.category,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  tags = excluded.tags,
  related_card_codes = excluded.related_card_codes,
  related_set_codes = excluded.related_set_codes,
  related_evidence_ids = excluded.related_evidence_ids,
  updated_at = now();

insert into blog_posts (
  slug,
  title,
  excerpt,
  content_markdown,
  status,
  category,
  author,
  seo_title,
  seo_description,
  tags,
  related_card_codes,
  related_set_codes,
  related_evidence_ids
)
select
  'card-spotlight-' || lower(card_code) || '-' || slug_name,
  'Card Spotlight: ' || display_name || ' ' || card_code,
  'Draft spotlight for ' || display_name || ', linked to ' || card_code || ' and awaiting evidence review.',
  '## Draft status

This spotlight should pull live identity, pricing, and evidence from the card page. Add narrative only after the evidence timeline is reviewed.',
  'DRAFT',
  'Card Spotlight',
  'AR Carddass Research Desk',
  card_code || ' ' || display_name || ' - One Piece AR Carddass Formation Spotlight',
  'Draft spotlight for ' || card_code || ' ' || display_name || '.',
  array['card-spotlight', lower(card_code)],
  array[card_code],
  array[left(card_code, 3)],
  array[]::text[]
from (
  values
    ('F01-01', 'Luffy', 'luffy'),
    ('F01-37', 'Ace', 'ace'),
    ('F02-20', 'Boa Hancock', 'boa-hancock'),
    ('F02-24', 'Crocodile', 'crocodile'),
    ('F03-03', 'Zoro', 'zoro'),
    ('F03-13', 'Sanji', 'sanji'),
    ('F04-13', 'Rob Lucci', 'rob-lucci'),
    ('F04-27', 'Sogeking', 'sogeking')
) as spotlight(card_code, display_name, slug_name)
on conflict (slug) do update
set
  title = excluded.title,
  excerpt = excluded.excerpt,
  content_markdown = excluded.content_markdown,
  related_card_codes = excluded.related_card_codes,
  related_set_codes = excluded.related_set_codes,
  updated_at = now();
