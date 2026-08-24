# Supabase Migration 015 - Knowledge Hub Blog

Copy everything inside `supabase/migrations/015_knowledge_hub_blog.sql` into the Supabase SQL Editor and run it once.

This migration:

- creates the `blog_post_status` enum if missing;
- creates the `blog_posts` table;
- enables RLS;
- allows public reads only for `PUBLISHED` posts;
- seeds one published pricing-methodology article;
- seeds Formation guides, intro guide, rarity guide, and first eight card spotlights as `DRAFT`.

Draft posts are not visible on `/blog` until their `status` is changed to `PUBLISHED` and `published_at` is filled.
