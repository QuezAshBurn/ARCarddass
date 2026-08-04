"use client";

import { useState } from "react";
import Link from "next/link";
import { BoosterPack } from "@/components/pull/BoosterPack";
import { CardArt } from "@/components/CardArt";
import { cards } from "@/lib/data/cards";

export function PullExperience() {
  const [state, setState] = useState<"sealed" | "opening" | "opened">("sealed");
  const revealCards = [cards[0], cards[4], cards[7]];

  function openPack() {
    setState("opening");
    window.setTimeout(() => setState("opened"), 760);
  }

  function skipAnimation() {
    setState("opened");
  }

  function replay() {
    setState("sealed");
  }

  return (
    <div className="pack-stage" aria-live="polite">
      <BoosterPack state={state} />
      {state === "opened" && (
        <div className="pull-cards" aria-label="Formation pack reveal result">
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
