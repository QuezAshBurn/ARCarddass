import Link from "next/link";
import type { Card } from "@/lib/data/cards";
import { formatMarketUpdateAt, formatPeso, getPrimaryVersion } from "@/lib/data/cards";

type MarketTableProps = {
  cards: Card[];
  limit?: number;
};

export function MarketTable({ cards, limit }: MarketTableProps) {
  const visibleCards = typeof limit === "number" ? cards.slice(0, limit) : cards;

  return (
    <div className="table-wrap market-table-wrap">
      <table className="market-table">
        <thead>
          <tr>
            <th>Card</th>
            <th>Rarity</th>
            <th>Market price</th>
            <th>Per update</th>
            <th>Demand</th>
            <th>Scarcity</th>
            <th>Confidence</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {visibleCards.map((card) => {
            const primary = getPrimaryVersion(card);
            const changeClass =
              primary.weeklyChangePercent >= 0 ? "positive" : "negative";

            return (
              <tr key={card.cardNumber}>
                <td data-label="Card">
                  <Link href={`/cards/${card.cardNumber}`}>
                    <strong>{card.characterName}</strong>
                    <br />
                    <span className="muted">
                      {card.cardNumber} · {card.formationSet}
                    </span>
                  </Link>
                </td>
                <td data-label="Rarity">{card.rarity}</td>
                <td data-label="Market price">{formatPeso(primary.currentPublishedPricePhp)}</td>
                <td className={changeClass} data-label="Per update">
                  {primary.weeklyChangePercent >= 0 ? "+" : ""}
                  {primary.weeklyChangePercent.toFixed(2)}%
                </td>
                <td data-label="Demand">{primary.demandScore}/100</td>
                <td data-label="Scarcity">{primary.scarcityScore}/100</td>
                <td data-label="Confidence">{primary.confidence}</td>
                <td data-label="Updated">{formatMarketUpdateAt(primary.lastMarketUpdateAt) ?? "Pending"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}