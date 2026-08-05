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
    <div className="table-wrap">
      <table>
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
                <td>
                  <Link href={`/cards/${card.cardNumber}`}>
                    <strong>{card.characterName}</strong>
                    <br />
                    <span className="muted">
                      {card.cardNumber} · {card.formationSet}
                    </span>
                  </Link>
                </td>
                <td>{card.rarity}</td>
                <td>{formatPeso(primary.currentPublishedPricePhp)}</td>
                <td className={changeClass}>
                  {primary.weeklyChangePercent >= 0 ? "+" : ""}
                  {primary.weeklyChangePercent.toFixed(2)}%
                </td>
                <td>{primary.demandScore}/100</td>
                <td>{primary.scarcityScore}/100</td>
                <td>{primary.confidence}</td>
                <td>{formatMarketUpdateAt(primary.lastMarketUpdateAt) ?? "Pending"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
