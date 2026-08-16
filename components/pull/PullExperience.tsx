"use client";

import { useState } from "react";
import Link from "next/link";
import { BoosterPack } from "@/components/pull/BoosterPack";
import { CardArt } from "@/components/CardArt";
import type { Card } from "@/lib/data/cards";

type PullExperienceProps = {
  cards: Card[];
};

function shuffleCards(cardPool: Card[]) {
  return [...cardPool].sort(() => Math.random() - 0.5);
}

function takeRandom(cardPool: Card[], count: number) {
  return shuffleCards(cardPool).slice(0, count);
}

function makeRevealCards(kingRarePool: Card[], wantedPool: Card[]) {
  return shuffleCards([
    ...takeRandom(kingRarePool, 2),
    ...takeRandom(wantedPool, 1)
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
      {!canReveal && (
        <p className="muted">
          Wanted cards must be seeded in Supabase before mixed packs can be opened.
        </p>
      )}
    </div>
  );
}
