import { MarketTable } from "@/components/MarketTable";
import { getMarketSummary } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function MarketPage() {
  const cards = await getCardsWithLivePrices();
  const summary = getMarketSummary(cards);

  return (
    <section className="shell section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Market dashboard</span>
          <h1>Twice-daily movement from current published prices.</h1>
          <p>
            This view ranks prices, demand, scarcity, card rarity, visible circulation,
            and latest movement across all live premium launch cards. Prices are
            updated from market signals, not random adjustments.
          </p>
        </div>
        <span className="pill">{summary.lastMarketUpdate}</span>
      </div>
      <div className="grid three">
        <div className="content-card">
          <span className="label">Most demanded</span>
          <h2>{summary.mostDemanded[0].card.characterName}</h2>
          <p>{summary.mostDemanded[0].version.demandScore}/100 demand score.</p>
        </div>
        <div className="content-card">
          <span className="label">Scarcest</span>
          <h2>{summary.scarcest[0].card.characterName}</h2>
          <p>{summary.scarcest[0].version.scarcityScore}/100 scarcity score.</p>
        </div>
        <div className="content-card">
          <span className="label">Softest movement</span>
          <h2>{summary.biggestDecliners[0].card.characterName}</h2>
          <p>{summary.biggestDecliners[0].version.weeklyChangePercent.toFixed(2)}% this update.</p>
        </div>
      </div>
      <div style={{ height: 22 }} />
      <MarketTable cards={cards} />
    </section>
  );
}
