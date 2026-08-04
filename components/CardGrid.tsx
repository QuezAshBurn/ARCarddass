import Link from "next/link";
import { CardArt } from "@/components/CardArt";
import type { Card } from "@/lib/data/cards";
import { formatPeso, getPrimaryVersion, getSetCode } from "@/lib/data/cards";

type CardGridProps = {
  cards: Card[];
};

export function CardGrid({ cards }: CardGridProps) {
  return (
    <div className="grid cards">
      {cards.map((card) => {
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
            />
            <div>
              <div className="card-row">
                <h3>{card.characterName}</h3>
                <span className="pill live">{primary.pricingState}</span>
              </div>
              <p>{card.summary}</p>
            </div>
            <div className="card-row">
              <span className="muted">{card.cardNumber}</span>
              <strong className="price-text">{formatPeso(primary.currentPublishedPricePhp)}</strong>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
