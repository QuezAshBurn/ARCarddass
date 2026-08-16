import Link from "next/link";
import { Fragment } from "react";
import { CollectorConfidenceBadge } from "@/components/CollectorConfidenceBadge";
import { CollectorPrice } from "@/components/CollectorPrice";
import { PriceMovementExplanation } from "@/components/PriceMovementExplanation";
import { PriceRange } from "@/components/PriceRange";
import type { Card } from "@/lib/data/cards";
import { formatMarketUpdateAt, formatPeso, getMarketRange, getPrimaryVersion } from "@/lib/data/cards";

type MarketTableProps = {
  cards: Card[];
  limit?: number;
};

function getMovementStory(percent: number) {
  const absolute = Math.abs(percent);

  if (absolute < 0.01) return "Held";
  if (absolute < 1.5) return percent > 0 ? "Slight rise" : "Slight dip";
  if (absolute < 7.5) return percent > 0 ? "Evidence-backed rise" : "Evidence-backed dip";

  return percent > 0 ? "Capped strong rise" : "Capped strong dip";
}

export function MarketTable({ cards, limit }: MarketTableProps) {
  const visibleCards = typeof limit === "number" ? cards.slice(0, limit) : cards;

  return (
    <div className="table-wrap market-table-wrap">
      <table className="market-table">
        <thead>
          <tr>
            <th>Card</th>
            <th>Rarity</th>
            <th>Collector price</th>
            <th>Market index</th>
            <th>Low market</th>
            <th>High market</th>
            <th>Verified sales</th>
            <th>Reseller ask</th>
            <th>Demand</th>
            <th>Scarcity</th>
            <th>Trend</th>
            <th>Confidence</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {visibleCards.map((card) => {
            const primary = getPrimaryVersion(card);
            const marketRange = getMarketRange(primary);
            const changeClass = primary.weeklyChangePercent >= 0 ? "positive" : "negative";

            return (
              <Fragment key={card.cardNumber}>
                <tr>
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
                  <td data-label="Collector price">
                    <CollectorPrice value={primary.collectorPricePhp} />
                  </td>
                  <td data-label="Market index">
                    <strong>{formatPeso(primary.currentPublishedPricePhp)}</strong>
                    <br />
                    <span className="market-row-note">Market Price</span>
                  </td>
                  <td data-label="Low market">
                    <strong>{formatPeso(marketRange.lowMarketPhp)}</strong>
                    <br />
                    <span className="market-row-note">Floor side</span>
                  </td>
                  <td data-label="High market">
                    <strong>{formatPeso(marketRange.highMarketPhp)}</strong>
                    <br />
                    <span className="market-row-note">Ceiling side</span>
                  </td>
                  <td data-label="Verified sales">
                    <PriceRange
                      low={primary.verifiedSaleLowPhp}
                      high={primary.verifiedSaleHighPhp}
                      count={primary.verifiedSaleCount}
                      singularLabel="verified sale"
                      pluralLabel="verified sales"
                      emptyLabel="No verified sales"
                    />
                  </td>
                  <td data-label="Reseller ask">
                    <PriceRange
                      low={primary.resellerAskLowPhp}
                      high={primary.resellerAskHighPhp}
                      count={primary.resellerAskCount}
                      singularLabel="asking listing"
                      pluralLabel="asking listings"
                      emptyLabel="No active asks"
                    />
                  </td>
                  <td data-label="Demand">{primary.demandScore}/100</td>
                  <td data-label="Scarcity">{primary.scarcityScore}/100</td>
                  <td className={changeClass} data-label="Trend">
                    <strong>
                      {primary.weeklyChangePercent >= 0 ? "+" : ""}
                      {primary.weeklyChangePercent.toFixed(2)}%
                    </strong>
                    <br />
                    <span className="market-row-note">{getMovementStory(primary.weeklyChangePercent)}</span>
                  </td>
                  <td data-label="Confidence">
                    <CollectorConfidenceBadge confidence={primary.collectorPriceConfidence} />
                  </td>
                  <td data-label="Updated">{formatMarketUpdateAt(primary.lastMarketUpdateAt) ?? "Pending"}</td>
                </tr>
                <tr className="market-explain-row">
                  <td colSpan={13}>
                    <PriceMovementExplanation card={card} version={primary} compact />
                  </td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
