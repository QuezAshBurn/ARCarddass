import Link from "next/link";
import { CardArt } from "@/components/CardArt";
import type { Card } from "@/lib/data/cards";
import { formatPeso, getPrimaryVersion, getSetCode, getProductLineSetLabel } from "@/lib/data/cards";

type CardFormationProps = {
  cards: Card[];
};

export function CardFormation({ cards }: CardFormationProps) {
  return (
    <div className="card-formation">
      {cards.map((card, index) => {
        const primary = getPrimaryVersion(card);
        const isPricingPending = primary.pricingState === "UNINITIALIZED";

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
                <span className={`pill ${isPricingPending ? "review" : "live"}`}>
                  {isPricingPending ? "PENDING" : primary.confidence}
                </span>
              </div>
              <p>{card.cardNumber} · {card.catalogueGroup ?? getProductLineSetLabel(card.productLine, getSetCode(card.cardNumber))}</p>
            </div>
            <div className="card-row">
              <span className="muted">{card.rarity}</span>
              <strong className="price-text">
                {isPricingPending ? "Pricing pending" : formatPeso(primary.currentPublishedPricePhp)}
              </strong>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
