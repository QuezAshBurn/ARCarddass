# Pricing Movement

This document explains what should happen when the pricing engine updates cards.

## Core principle

The pricing engine calculates price. The newsletter explains what happened. Blog/newsletter content must never become the pricing source of truth.

## Update cadence

The app currently supports automated market updates through cron routes. The intended cadence is every 3 hours unless changed in Vercel configuration.

## Rebase vs recurring movement

Use rebase only when intentionally resetting a card to a corrected reference state.

Normal recurring movement should:

1. Read latest card state.
2. Read accepted market evidence.
3. Apply pricing priority and guardrails.
4. Store a new market state/snapshot.
5. Explain movement or hold reason.

## Why a timestamp can change while price stays flat

The engine can run, review the card, and still publish `0%` movement when:

- evidence is insufficient;
- the latest signal is under review;
- a graded price cannot safely determine raw price;
- active asks exist but sold evidence is missing;
- movement exceeds guardrails.

## Collector-facing explanation

Each card should make the reason visible:

- market index;
- collector estimate;
- low market / high market;
- verified sale count;
- active ask count;
- demand and scarcity;
- confidence;
- movement explanation.

## Special notes

Only King Rare hits receive the pack shine effect. Wanted and Film Z can appear in pulls, but they should not receive the KR shine treatment.
