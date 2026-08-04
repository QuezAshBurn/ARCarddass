import { MarketTable } from "@/components/MarketTable";
import { cards, getMarketSummary } from "@/lib/data/cards";

export default function MarketPage() {
  const summary = getMarketSummary();

  return (
    <section className="shell section">
      <span className="eyebrow">Market dashboard</span>
      <h1>Weekly movement from current published prices.</h1>
      <p>
        This view ranks prices, demand, scarcity, and latest movement across all
        live premium launch cards.
      </p>
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
          <p>{summary.biggestDecliners[0].version.weeklyChangePercent.toFixed(2)}% this week.</p>
        </div>
      </div>
      <div style={{ height: 22 }} />
      <MarketTable cards={cards} />
    </section>
  );
}
