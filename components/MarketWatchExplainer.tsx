import type { Card } from "@/lib/data/cards";
import { getPrimaryVersion } from "@/lib/data/cards";
import { buildPriceMovementExplanation } from "@/lib/domain/price-explanations";

type MarketWatchExplainerProps = {
  cards: Card[];
  lastMarketUpdate: string;
};

function getMovementLabel(percent: number) {
  const absolute = Math.abs(percent);

  if (absolute < 0.01) return "Held";
  if (absolute < 1.5) return percent > 0 ? "Slight rise" : "Slight dip";
  if (absolute < 7.5) return percent > 0 ? "Moderate rise" : "Moderate dip";

  return percent > 0 ? "Strong capped rise" : "Strong capped dip";
}

function getMovementCopy(percent: number) {
  if (Math.abs(percent) < 0.01) {
    return "No accepted fresh material evidence was found for this pricing slot, so the public price stayed still.";
  }

  return "Fresh accepted evidence moved the KPI score, then the movement cap limited the published change.";
}

export function MarketWatchExplainer({ cards, lastMarketUpdate }: MarketWatchExplainerProps) {
  const primaryRows = cards.map((card) => ({
    card,
    version: getPrimaryVersion(card)
  }));
  const movers = primaryRows.filter(({ version }) => Math.abs(version.weeklyChangePercent) >= 0.01);
  const topMomentum = [...primaryRows].sort(
    (a, b) => Math.abs(b.version.weeklyChangePercent) - Math.abs(a.version.weeklyChangePercent)
  )[0];
  const strongestDemand = [...primaryRows].sort(
    (a, b) => b.version.demandScore - a.version.demandScore
  )[0];
  const signalNews = primaryRows
    .map(({ card, version }) => ({
      card,
      version,
      explanation: buildPriceMovementExplanation(card, version)
    }))
    .sort((a, b) => Math.abs(b.explanation.movementPercent) - Math.abs(a.explanation.movementPercent))
    .slice(0, 4);

  return (
    <div className="market-watch">
      <div className="market-watch__hero">
        <div>
          <span className="label">Autonomous market watch</span>
          <h2>What happened behind the price?</h2>
          <p>
            The system checks evidence, validates whether it is trustworthy, scores the
            market, applies caps, then publishes only if there is a meaningful signal.
          </p>
        </div>
        <div className="watch-status-card">
          <span className="pulse-dot" aria-hidden="true" />
          <span>Monitor check</span>
          <strong>{lastMarketUpdate.replace("Updated ", "")}</strong>
          <small>
            {movers.length === 0
              ? "Prices held: no fresh material movement"
              : `${movers.length} card movement signal${movers.length === 1 ? "" : "s"}`}
          </small>
        </div>
      </div>

      <div className="watch-grid">
        <div className="content-card watch-card">
          <span className="label">Latest price action</span>
          <h3>{topMomentum ? getMovementLabel(topMomentum.version.weeklyChangePercent) : "Held"}</h3>
          <p>
            {topMomentum
              ? `${topMomentum.card.characterName}: ${topMomentum.version.weeklyChangePercent >= 0 ? "+" : ""}${topMomentum.version.weeklyChangePercent.toFixed(2)}%. ${getMovementCopy(topMomentum.version.weeklyChangePercent)}`
              : "No pricing rows are available yet."}
          </p>
        </div>

        <div className="content-card watch-card">
          <span className="label">Market pressure</span>
          <h3>{strongestDemand.card.characterName}</h3>
          <p>
            Demand {strongestDemand.version.demandScore}/100 and scarcity{" "}
            {strongestDemand.version.scarcityScore}/100 are visible pressure signals
            before any price movement is allowed.
          </p>
        </div>

        <div className="content-card watch-card">
          <span className="label">Public price state</span>
          <h3>{movers.length === 0 ? "Stable" : "Changed"}</h3>
          <p>
            {movers.length === 0
              ? "The site refreshed its market timestamp, but no card moved because the evidence gate did not pass."
              : "One or more prices changed after accepted evidence passed validation and movement caps."}
          </p>
        </div>
      </div>

      <div className="watch-flow" aria-label="Market watch processing flow">
        {[
          ["1", "Collect", "Listings, sales, watchers, carts, bids, search demand"],
          ["2", "Validate", "Duplicates, version, condition, seller and evidence confidence"],
          ["3", "Score", "Supply, demand, scarcity, circulation, price momentum"],
          ["4", "Publish", "Movement cap, audit snapshot, public price update"]
        ].map(([step, title, copy]) => (
          <div className="watch-flow__step" key={step}>
            <span>{step}</span>
            <strong>{title}</strong>
            <p>{copy}</p>
          </div>
        ))}
      </div>

      <div className="watch-news">
        <div className="section-head compact">
          <div>
            <span className="label">Market news feed</span>
            <h3>Signals the system can explain</h3>
          </div>
          <span className="pill">
            {movers.length === 0 ? "No new price-moving evidence" : "Movement detected"}
          </span>
        </div>
        <div className="news-list">
          {signalNews.map(({ card, explanation }) => (
            <div className="news-item" key={card.cardNumber}>
              <span className={explanation.tone === "held" ? "pill review" : "pill live"}>
                {explanation.tone === "held" ? "held" : "moved"}
              </span>
              <div>
                <strong>{card.characterName}</strong>
                <p>
                  {explanation.headline} · {explanation.signals[0].value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

