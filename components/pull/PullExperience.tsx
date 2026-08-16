"use client";

import { useState } from "react";
import Link from "next/link";
import { BoosterPack } from "@/components/pull/BoosterPack";
import { CardArt } from "@/components/CardArt";
import { cards, type Card } from "@/lib/data/cards";

const kingRarePool = cards.filter(
  (card) => card.productLine === "Formation" && (card.rarity === "KR" || card.rarity === "SKR")
);
const wantedPool = cards.filter((card) => card.productLine === "Wanted");

function shuffleCards(cardPool: Card[]) {
  return [...cardPool].sort(() => Math.random() - 0.5);
}

function takeRandom(cardPool: Card[], count: number) {
  return shuffleCards(cardPool).slice(0, count);
}

function makeRevealCards() {
  return shuffleCards([
    ...takeRandom(kingRarePool, 2),
    ...takeRandom(wantedPool, 1)
  ]);
}

function makeInitialRevealCards() {
  return [...kingRarePool.slice(0, 2), ...wantedPool.slice(0, 1)];
}

export function PullExperience() {
  const [state, setState] = useState<"sealed" | "opening" | "opened">("sealed");
  const [revealCards, setRevealCards] = useState<Card[]>(() => makeInitialRevealCards());

  function openPack() {
    setRevealCards(makeRevealCards());
    setState("opening");
    window.setTimeout(() => setState("opened"), 760);
  }

  function skipAnimation() {
    setRevealCards(makeRevealCards());
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
        <button className="button primary" onClick={openPack} type="button">
          Open Pack
        </button>
        <button className="button ghost" onClick={skipAnimation} type="button">
          Skip Animation
        </button>
        <button className="button secondary" onClick={replay} type="button">
          Replay
        </button>
        <Link className="button secondary" href="/market">
          View Market
        </Link>
      </div>
    </div>
  );
}
