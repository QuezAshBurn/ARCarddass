# Market Evidence Updates

This file documents the expected evidence update flow.

## Evidence sources

Evidence can come from marketplaces such as eBay, Mercari Japan, Yahoo Auctions Japan, JDirect, and other collector marketplaces. Use marketplace data carefully and label the source.

## Required evidence fields

Where possible, store:

- card code;
- product line / catalogue group;
- version;
- marketplace;
- source URL;
- listing or transaction ID;
- event type;
- event date;
- discovered date;
- native amount and currency;
- PHP amount;
- sale price or listing price;
- condition;
- validation status;
- graded status;
- grader and grade;
- raw-equivalent PHP value for graded evidence.

## Graded evidence rule

Use graded-to-raw conversion only when no raw market price is available. If raw marketplace pricing is available and higher than the graded-derived raw estimate, use the raw marketplace price.

## Review-required examples

Mark evidence for review when:

- accepted best-offer amount is hidden;
- item is no longer available but sold price is unclear;
- card version is uncertain;
- condition materially affects value;
- bundle allocation is unclear;
- listing appears duplicated;
- price is an extreme outlier.

## Newsletter usage

Evidence updates can feed the newsletter, but the newsletter must not alter prices directly. It should explain evidence already captured by the market/pricing system.
