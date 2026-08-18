# All-collection market crawl queue

Copy and run only the SQL from `013_all_catalogue_market_crawl_targets.sql` in
the Supabase SQL Editor.

It creates one database-backed crawl target per live card version and marketplace
source. It covers King Rare, Wanted, and Film Z without manually listing card
names or prices. The results panel will return a single target-count value.

This script does **not** invent market values or fetch external websites itself.
The deployed, authenticated collector reads the catalogue and writes only
traceable market events returned by an approved API or partner feed.

You can safely run this again after adding another card collection:

```sql
select refresh_market_crawl_targets();
```
