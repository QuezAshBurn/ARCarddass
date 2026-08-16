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
  { wantedCount: 3, kingRareCount: 0, weight: 60 },
  { wantedCount: 2, kingRareCount: 1, weight: 25 },
  { wantedCount: 1, kingRareCount: 2, weight: 12 },
  { wantedCount: 0, kingRareCount: 3, weight: 3 }
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

function makeRevealCards(kingRarePool: Card[], wantedPool: Card[]) {
  const outcome = selectPackOutcome();
  const selectedWanted = takeRandom(wantedPool, outcome.wantedCount);
  const selectedKingRares = takeRandom(kingRarePool, outcome.kingRareCount);
  const missingCards = 3 - selectedWanted.length - selectedKingRares.length;
  const fallbackPool = selectedWanted.length < outcome.wantedCount ? kingRarePool : wantedPool;

  return shuffleCards([
    ...selectedWanted,
    ...selectedKingRares,
    ...takeRandom(fallbackPool, missingCards)
  ]);
}

export function PullExperience({ cards }: PullExperienceProps) {
  const kingRarePool = cards.filter(
    (card) => card.productLine === "Formation" && (card.rarity === "KR" || card.rarity === "SKR")
  );
  const wantedPool = cards.filter((card) => card.productLine === "Wanted");
  const canReveal = kingRarePool.length > 0 && wantedPool.length > 0;
  const [state, setState] = useState<"sealed" | "opening" | "opened">("sealed");
  const [revealCards, setRevealCards] = useState<Card[]>([]);

  function openPack() {
    if (!canReveal) return;

    setRevealCards(makeRevealCards(kingRarePool, wantedPool));
    setState("opening");
    window.setTimeout(() => setState("opened"), 760);
  }

  function skipAnimation() {
    if (!canReveal) return;

    setRevealCards(makeRevealCards(kingRarePool, wantedPool));
    setState("opened");
  }

  function replay() {
    setState("sealed");
  }

  return (
    <div className="pack-stage" aria-live="polite">
      <BoosterPack state={state} />
      {state === "opened" && (
        <div className="pull-cards" aria-label="Random King Rare and Wanted pack reveal result">
          {revealCards.map((card, index) => (
            <Link href={`/cards/${card.cardNumber}`} key={card.cardNumber}>
              <CardArt
                characterName={card.characterName}
                cardNumber={card.cardNumber}
                rarity={card.rarity}
                accentA={card.accentA}
                accentB={card.accentB}
                imageSrc={card.frontImagePath}
                active={index === revealCards.length - 1}
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
        Random 3-card reveal: 60% three Wanted cards, 25% two Wanted plus one King
        Rare/SKR, 12% one Wanted plus two King Rare/SKR, and a 3% full King Rare/SKR hit.
      </p>
      {!canReveal && (
        <p className="muted">
          Live King Rare/SKR and Wanted cards are both needed to open a mixed pack.
        </p>
      )}
    </div>
  );
}
