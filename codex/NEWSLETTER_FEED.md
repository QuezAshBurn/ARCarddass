# Newsletter Feed

The public Blog should behave as a Pricing Newsletter feed only.

## Public scope

Show pricing newsletters, not a broad Knowledge Hub. Do not expose category chips such as History, Discovery, Set Guide, Grading Guide, or Card Spotlight unless the product direction changes again.

## Data source

Use the existing `blog_posts` table and the current newsletter generator. Do not hardcode newsletter articles into React pages.

The generator command is:

```bash
npm run blog:newsletter
```

Useful variants:

```bash
npm run blog:newsletter -- --days=7
npm run blog:newsletter -- --from=2026-08-17 --to=2026-08-24
npm run blog:newsletter -- --days=7 --preview
```

## Category

Generated pricing newsletters use:

```text
Weekly Market Recap
```

The public UI may label them as Pricing Newsletter.

## Publication rule

Generated newsletters default to `DRAFT`. Do not publish automatically. A human/admin review should decide whether a draft becomes `PUBLISHED`.

## Structure

Newsletter drafts should follow this structure:

```markdown
# AR Carddass Formation Market Watch
## Week of YYYY-MM-DD

### Market Summary

### Premium Eight

### Biggest Market Events

### Cards Under Review

### Historical Discoveries Added This Period

### What Collectors Should Watch Next

### Evidence
```

## Premium Eight

The newsletter must summarize meaningful developments for:

- F01-01 KR Monkey D. Luffy
- F01-37 KR Portgas D. Ace
- F02-20 KR Boa Hancock
- F02-24 KR Crocodile
- F03-03 KR Roronoa Zoro
- F03-13 KR Sanji
- F04-13 KR Rob Lucci
- F04-27 SKR Sogeking

## Timing rule

Use `eventAt` to decide when the market event happened. Do not treat `processedAt` or `discoveredAt` as the sale/auction date.

Historical discoveries can be mentioned, but they must not be described as current-week sales.
