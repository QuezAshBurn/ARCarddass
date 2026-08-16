"use client";

import { useState } from "react";
import Link from "next/link";
import { BoosterPack } from "@/components/pull/BoosterPack";
import { CardArt } from "@/components/CardArt";
import type { Card } from "@/lib/data/cards";

type PullExperienceProps = {
  cards: Card[];
};

const PACK_OUTCOMES = [
  { standardCount: 3, kingRareCount: 0, weight: 97 },
  { standardCount: 2, kingRareCount: 1, weight: 3 }
] as const;

function shuffleCards(cardPool: Card[]) {
  return [...cardPool].sort(() => Math.random() - 0.5);
}

function takeRandom(cardPool: Card[], count: number) {
  return shuffleCards(cardPool).slice(0, count);
}

function selectPackOutcome() {
  const roll = Math.random() * 100;
  let runningWeight = 0;

  for (const outcome of PACK_OUTCOMES) {
    runningWeight += outcome.weight;

    if (roll < runningWeight) {
      return outcome;
    }
  }

  return PACK_OUTCOMES[0];
}

function isShinyHit(card: Card) {
  return card.productLine === "Formation" &&
    card.catalogueGroup !== "Film Z" &&
    card.rarity === "KR";
}

function makeRevealCards(kingRarePool: Card[], standardPool: Card[]) {
  const outcome = selectPackOutcome();
  const selectedStandardCards = takeRandom(standardPool, outcome.standardCount);
  const selectedKingRares = takeRandom(kingRarePool, outcome.kingRareCount);
  const missingCards = 3 - selectedStandardCards.length - selectedKingRares.length;
  const fallbackPool = selectedStandardCards.length < outcome.standardCount ? kingRarePool : standardPool;

  return shuffleCards([
    ...selectedStandardCards,
    ...selectedKingRares,
    ...takeRandom(fallbackPool, missingCards)
  ]);
}

export function PullExperience({ cards }: PullExperienceProps) {
  const kingRarePool = cards.filter(
    (card) => isShinyHit(card)
  );
  const standardPool = cards.filter(
    (card) => card.productLine === "Wanted" || card.catalogueGroup === "Film Z"
  );
  const canReveal = kingRarePool.length > 0 && standardPool.length > 0;
  const [state, setState] = useState<"sealed" | "opening" | "opened">("sealed");
  const [revealCards, setRevealCards] = useState<Card[]>([]);

  function openPack() {
    if (!canReveal) return;

    setRevealCards(makeRevealCards(kingRarePool, standardPool));
    setState("opening");
    window.setTimeout(() => setState("opened"), 760);
  }

  function skipAnimation() {
    if (!canReveal) return;

    setRevealCards(makeRevealCards(kingRarePool, standardPool));
    setState("opened");
  }

  function replay() {
    setState("sealed");
  }

  return (
    <div className="pack-stage" aria-live="polite">
      <BoosterPack state={state} />
      {state === "opened" && (
        <div className="pull-cards" aria-label="Random King Rare, Wanted, and Film Z pack reveal result">
          {revealCards.map((card) => (
            <Link href={`/cards/${card.cardNumber}`} key={card.cardNumber}>
              <CardArt
                characterName={card.characterName}
                cardNumber={card.cardNumber}
                rarity={card.rarity}
                accentA={card.accentA}
                accentB={card.accentB}
                imageSrc={card.frontImagePath}
                active={isShinyHit(card)}
              />
            </Link>
          ))}
        </div>
      )}
      <div className="pack-controls">
        <button className="button primary" disabled={!canReveal} onClick={openPack} type="button">
          Open Pack
        </button>
        <button className="button ghost" disabled={!canReveal} onClick={skipAnimation} type="button">
          Skip Animation
        </button>
        <button className="button secondary" onClick={replay} type="button">
          Replay
        </button>
        <Link className="button secondary" href="/market">
          View Market
        </Link>
      </div>
      <p className="muted">
        Random 3-card reveal: 97% are Wanted and Film Z cards. A 3% hit replaces one
        regular card with a shining King Rare.
      </p>
      {!canReveal && (
        <p className="muted">
          Live King Rare plus Wanted or Film Z cards are needed to open a mixed pack.
        </p>
      )}
    </div>
  );
}
