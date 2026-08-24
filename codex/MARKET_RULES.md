# AR Carddass Market Rules

This file is the operating rulebook for ARCarddass market pricing. It is documentation only; the live price source of truth remains Supabase market state and card-version records.

## Source priority

Pricing evidence is evaluated in this order:

1. Highest verified last-sold result from the most recent 3 months.
2. If no usable sold evidence exists, highest active asking/listing price.
3. If only graded evidence exists, convert graded value to raw equivalent using the current graded-to-raw formula.

If raw marketplace evidence exists, do not replace it with a lower graded-derived raw estimate. Use the higher eligible value.

## Evidence classes

- `VERIFIED_SALE` and `COMPLETED_AUCTION` are strongest when the paid amount is confirmed.
- Active asks support high-reference and reseller-ask views, but they are not sold proof.
- Best-offer sales with hidden accepted amounts can be shown as evidence, but should remain under review unless the accepted amount is known.
- Disappeared listings are not automatically sold.
- Graded sales must show grader and grade when available.

## Movement guardrails

Recurring pricing starts from the latest published price, not from initial launch pricing.

- No fresh material evidence: `0%`
- No verified sale but weak signal exists: up to `±1.5%`
- One independent verified sale: up to `±7.5%`
- Multiple independent verified sales: up to `±12%`
- Major outlier or record event: hold for review unless accepted by rules/admin.

## Product lines

King Rare, Wanted, and Film Z are separate catalogue groups. Their evidence and pricing should not bleed into one another.

## Version rules

JP, EN, and HK versions can carry different values. CN/TW/HK regional Chinese versions are represented together as HK when the cards are the same release bucket.

## Public communication

Always explain that pricing is based on evidence signals such as supply, demand, rarity, scarcity, circulation, verified sales, active asks, and collector confidence. Never present random-looking price movement without the reason.
