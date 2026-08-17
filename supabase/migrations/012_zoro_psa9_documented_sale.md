# Documented Zoro PSA 9 sale proof

This file records the user-supplied evidence for **F03-03 Roronoa Zoro, PSA 9**:

- Marketplace: eBay
- Page status: Sold
- Date displayed: 13 August 2026
- Price displayed: **PHP 184,347**
- Important qualifier: the page says **"or Best Offer"**, so the final negotiated amount is not publicly confirmed.

## Why the status is review-required

The record is deliberately visible to customers as documented graded-sale evidence, but it does **not** change the raw Market Index automatically. This avoids presenting an undisclosed best-offer amount as a confirmed completed-price value.

The raw equivalent displayed is **PHP 131,676**, calculated as `PHP 184,347 / 1.40` for PSA 9. It is only eligible as a fallback when no valid raw sold or raw active-ask reference exists.

## Run in Supabase

1. Open **Supabase → SQL Editor → New query**.
2. Open [012_zoro_psa9_documented_sale.sql](012_zoro_psa9_documented_sale.sql).
3. Copy only the SQL contents from `begin;` through `commit;`.
4. Paste it into Supabase and click **Run**.

Once it is inserted, the database-backed **Market proof** panel appears automatically on the Zoro card page and the evidence ledger.
