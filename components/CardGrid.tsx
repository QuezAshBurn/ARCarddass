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
        const isWantedResearch = card.productLine === "Wanted";
        const productLineLabel = card.productLine === "Formation" ? "King Rare" : card.productLine;

        return (
          <Link
            className="card-tile set-panel"
            data-set={getSetCode(card.cardNumber)}
            data-line={card.productLine.toLowerCase()}
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
                <span className={`pill ${isWantedResearch ? "review" : "live"}`}>
                  {isWantedResearch ? "RESEARCH" : primary.pricingState}
                </span>
              </div>
              <span className="market-row-note">
                {productLineLabel}
                {card.printedNumber ? ` · ${card.printedNumber}` : ""}
              </span>
              <p>{card.summary}</p>
            </div>
            <div className="card-row">
              <span className="muted">{card.cardNumber}</span>
              <strong className="price-text">
                {isWantedResearch ? `High ref ${formatPeso(primary.currentPublishedPricePhp)}` : formatPeso(primary.currentPublishedPricePhp)}
              </strong>
            </div>
            {isWantedResearch && card.researchPricingConfidence && (
              <div className="research-source">
                <span>{card.researchPricingConfidence}</span>
                <small>{card.researchPricingSource}</small>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
