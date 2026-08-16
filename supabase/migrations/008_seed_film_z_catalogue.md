# Film Z catalogue group

This migration adds the ten supplied **One Piece Film Z** scans as a database-backed Formation 04 subgroup. It does **not** invent prices: every Film Z card is shown as **Pricing pending** until raw-market and sold-listing evidence is collected.

1. Open Supabase → **SQL Editor** → **New query**.
2. Open [008_seed_film_z_catalogue.sql](008_seed_film_z_catalogue.sql), copy only its SQL, and run it.
3. Confirm the final query returns ten rows with `pricing_state = UNINITIALIZED`.

The website reads the catalogue, scan paths, printed stats, and future prices from Supabase. Once pricing evidence is added, the normal hourly collection and price workflow can initialize these cards without a code change.
