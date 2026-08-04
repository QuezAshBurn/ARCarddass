import Link from "next/link";
import { CardFormation } from "@/components/cards/CardFormation";
import { FormationWordmark } from "@/components/brand/FormationWordmark";
import { MarketTable } from "@/components/MarketTable";
import { PullExperience } from "@/components/pull/PullExperience";
import { cards, evidenceRecords, formatPeso, getMarketSummary, getPrimaryVersion } from "@/lib/data/cards";

export default function HomePage() {
  const summary = getMarketSummary();
  const highest = [...cards].sort(
    (a, b) => getPrimaryVersion(b).currentPublishedPricePhp - getPrimaryVersion(a).currentPublishedPricePhp
  )[0];
  const highestVersion = getPrimaryVersion(highest);
  const latestSale = evidenceRecords.find((record) => record.status === "sold");

  return (
    <>
      <section className="hero">
        <div className="page-shell hero__content">
          <div className="hero__copy">
            <FormationWordmark />
            <span className="hero__eyebrow">One Piece AR Carddass Formation Market</span>
            <h1>Relive the pull. Track the market.</h1>
            <p>
              Track the rarest AR Carddass Formation cards with transparent PHP
              pricing, market evidence, demand, scarcity, and weekly movement.
            </p>
            <div className="hero__actions">
              <Link className="button primary" href="/pull">
                Open Formation Pack
              </Link>
              <Link className="button secondary" href="/market">
                View Market
              </Link>
              <Link className="button ghost" href="/methodology">
                Inspect Methodology
              </Link>
            </div>
          </div>
          <PullExperience />
        </div>
      </section>

      <section className="shell section">
        <div className="grid three">
          <div className="stat-card">
            <span>Highest market price</span>
            <strong>{formatPeso(highestVersion.currentPublishedPricePhp)}</strong>
            <p>{highest.characterName} · {highest.cardNumber}</p>
          </div>
          <div className="stat-card">
            <span>Biggest weekly mover</span>
            <strong className="positive">+{summary.biggestGainers[0].version.weeklyChangePercent.toFixed(2)}%</strong>
            <p>{summary.biggestGainers[0].card.characterName}</p>
          </div>
          <div className="stat-card">
            <span>Latest verified sale</span>
            <strong>{latestSale ? formatPeso(latestSale.phpPrice) : "Pending"}</strong>
            <p>{latestSale?.cardName ?? "Evidence ledger ready"}</p>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="section-head">
          <div>
            <span className="label">Premium-card formation</span>
            <h2>Eight launch cards, arranged like a collector formation.</h2>
          </div>
          <Link className="button secondary" href="/cards">
            Browse all cards
          </Link>
        </div>
        <CardFormation cards={cards} />
      </section>

      <section className="shell section">
        <div className="section-head">
          <div>
            <span className="label">Market board</span>
            <h2>Readable prices, no casino confetti.</h2>
          </div>
          <span className="pill">Updated {summary.lastMarketUpdate}</span>
        </div>
        <MarketTable cards={cards} />
      </section>

      <section className="shell section">
        <div className="grid two">
          <div className="content-card set-panel" data-set="F02">
            <span className="label">Demand and scarcity</span>
            <h2>{summary.mostDemanded[0].card.characterName} leads demand.</h2>
            <p>
              Demand and scarcity are surfaced as collector signals, not hidden
              spreadsheet magic. Users can move from price to weekly movement to
              KPI calculation to evidence.
            </p>
          </div>
          <div className="content-card paper-surface">
            <span className="label">Trust model</span>
            <h2>Exciting first, inspectable always.</h2>
            <p>
              Initial references lock once. Weekly updates start from the current
              published price. Admin adjustments preserve the system result and
              disclose the adjustment publicly.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
