import Image from "next/image";
import type { CSSProperties } from "react";
import { FoilCard } from "@/components/cards/FoilCard";
import { getSetCode } from "@/lib/data/cards";

type CardArtProps = {
  characterName: string;
  cardNumber: string;
  rarity: string;
  accentA: string;
  accentB: string;
  imageSrc?: string;
  large?: boolean;
  active?: boolean;
};

export function CardArt({
  characterName,
  cardNumber,
  rarity,
  accentA,
  accentB,
  imageSrc,
  large = false,
  active = false
}: CardArtProps) {
  const setCode = getSetCode(cardNumber);

  return (
    <FoilCard active={active}>
      <div
        className={`card-art ar-scan${imageSrc ? " has-scan" : ""}`}
        data-set={setCode}
        data-rarity={rarity}
        data-scanning={active ? "true" : undefined}
        style={
          {
            "--accent-a": accentA,
            "--accent-b": accentB,
            "--card-transition": `card-${cardNumber.toLowerCase()}`
          } as CSSProperties
        }
        aria-label={`${characterName} ${cardNumber} ${rarity} card scan`}
      >
        {imageSrc && (
          <Image
            src={imageSrc}
            alt={`${characterName} ${cardNumber} ${rarity} card front`}
            fill
            sizes={large ? "(max-width: 768px) 92vw, 42vw" : "(max-width: 768px) 46vw, 260px"}
            className="card-art__image"
            priority={large}
          />
        )}
        <div className="card-art__content">
          <div className="card-art__rarity">{rarity}</div>
          <div className="card-art__name" style={{ fontSize: large ? "1.2em" : "1em" }}>
            {characterName}
          </div>
          <div className="card-art__number">{cardNumber}</div>
        </div>
      </div>
    </FoilCard>
  );
}
