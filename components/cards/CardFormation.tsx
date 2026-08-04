import Link from "next/link";
import { CardArt } from "@/components/CardArt";
import type { Card } from "@/lib/data/cards";
import { formatPeso, getPrimaryVersion, getSetCode } from "@/lib/data/cards";

type CardFormationProps = {
  cards: Card[];
};

export function CardFormation({ cards }: CardFormationProps) {
  return (
    <div className="card-formation">
      {cards.map((card, index) => {
        const primary = getPrimaryVersion(card);

        return (
          <Link
            className="card-tile set-panel"
            data-set={getSetCode(card.cardNumber)}
            href={`/cards/${card.cardNumber}`}
            key={card.cardNumber}
          >
            <CardArt
              characterName={card.characterName}
              cardNumber={card.cardNumber}
              rarity={card.rarity}
              accentA={card.accentA}
              accentB={card.accentB}
              imageSrc={card.frontImagePath}
              active={index === cards.length - 1}
            />
            <div>
              <div className="card-row">
                <h3>{card.characterName}</h3>
                <span className="pill live">{primary.confidence}</span>
              </div>
              <p>{card.cardNumber} · {card.formationSet}</p>
            </div>
            <div className="card-row">
              <span className="muted">{card.rarity}</span>
              <strong className="price-text">{formatPeso(primary.currentPublishedPricePhp)}</strong>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
