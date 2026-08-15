import { notFound } from "next/navigation";
import { CardArt } from "@/components/CardArt";
import { CollectorConfidenceBadge } from "@/components/CollectorConfidenceBadge";
import { CollectorPrice } from "@/components/CollectorPrice";
import { PriceRelationship } from "@/components/PriceRelationship";
import { PriceSparkline } from "@/components/PriceSparkline";
import { PricingEvidenceSummary } from "@/components/PricingEvidenceSummary";
import { cards as staticCards, evidenceRecords, formatPeso, getPrimaryVersion } from "@/lib/data/cards";
import { getCardWithLivePrices } from "@/lib/data/live-cards";

type CardDetailPageProps = {
  params: {
    cardNumber: string;
  };
};

export function generateStaticParams() {
  return staticCards.map((card) => ({ cardNumber: card.cardNumber }));
}

export const dynamic = "force-dynamic";

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const card = await getCardWithLivePrices(params.cardNumber);

  if (!card) {
    notFound();
  }

  const primary = getPrimaryVersion(card);
  const records = evidenceRecords.filter((record) => record.cardNumber === card.cardNumber);

  return (
    <>
      <section className="shell detail-hero">
        <div className="panel detail-art">
          <CardArt
            characterName={card.characterName}
            cardNumber={card.cardNumber}
            rarity={card.rarity}
            accentA={card.accentA}
            accentB={card.accentB}
            imageSrc={card.frontImagePath}
            large
          />
        </div>
        <div className="content-card">
          <span className="eyebrow">
            {card.formationSet} &middot; {card.rarity} &middot; {card.cardNumber}
          </span>
          <h1>{card.characterName}</h1>
          <p>{card.summary}</p>
          <div className="grid three">
            <div className="stat-card">
              <span>Collector Price</span>
              <strong>
                <CollectorPrice value={primary.collectorPricePhp} compact />
              </strong>
            </div>
            <div className="stat-card">
              <span>Market Index</span>
              <strong>{formatPeso(primary.currentPublishedPricePhp)}</strong>
            </div>
            <div className="stat-card">
              <span>Collector confidence</span>
              <strong>
                <CollectorConfidenceBadge confidence={primary.collectorPriceConfidence} />
              </strong>
            </div>
          </div>
          <p className="relationship-note">
            <PriceRelationship
              collectorPrice={primary.collectorPricePhp}
              marketPrice={primary.currentPublishedPricePhp}
            />
          </p>
        </div>
      </section>

      <section className="shell section">
        <div className="content-card pricing-summary-card">
          <span className="label">Collector pricing summary</span>
          <h2>Collector Price vs Market Index</h2>
          <p>
            Collector Price estimates what a knowledgeable collector may reasonably
            pay based mainly on validated comparable sales. Market Index is the
            broader AR Carddass market price.
          </p>
          <div className="pricing-summary-grid">
            <span>Collector Price</span>
            <strong>{primary.collectorPricePhp ? formatPeso(primary.collectorPricePhp) : "Insufficient data"}</strong>
            <span>Fair Collector Range</span>
            <strong>
              {primary.verifiedSaleLowPhp && primary.verifiedSaleHighPhp
                ? `${formatPeso(primary.verifiedSaleLowPhp)}–${formatPeso(primary.verifiedSaleHighPhp)}`
                : "Insufficient verified sales"}
            </strong>
            <span>Market Index</span>
            <strong>{formatPeso(primary.currentPublishedPricePhp)}</strong>
            <span>Quick-Sale Estimate</span>
            <strong>{primary.quickSalePricePhp ? formatPeso(primary.quickSalePricePhp) : "Unavailable"}</strong>
            <span>Reseller Ask Range</span>
            <strong>
              {primary.resellerAskLowPhp && primary.resellerAskHighPhp
                ? `${formatPeso(primary.resellerAskLowPhp)}–${formatPeso(primary.resellerAskHighPhp)}`
                : "No active asks"}
            </strong>
            <span>Collector Tier</span>
            <strong>{primary.collectorTier ?? "Unavailable"}</strong>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="grid three">
          <div className="stat-card">
            <span>Initial Reference</span>
            <strong>{formatPeso(primary.initialReferencePricePhp)}</strong>
          </div>
          <div className="stat-card">
            <span>High-Water Reference</span>
            <strong>{formatPeso(primary.highWaterReferencePhp)}</strong>
          </div>
          <div className="stat-card">
            <span>Highest Verified Sale</span>
            <strong>{formatPeso(primary.highestVerifiedSalePhp)}</strong>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="grid two">
          <div className="content-card">
            <PricingEvidenceSummary version={primary} />
          </div>
          <div className="content-card">
            <span className="label">Low-listing guardrail</span>
            <h2>Asks are not sales.</h2>
            <p>
              A low active listing can appear in the feed, but it is not treated as
              a market sale until it is validated as a completed transaction. This
              prevents one visible ask from looking like a confirmed market crash.
            </p>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="grid two">
          <div className="content-card">
            <span className="label">Price history</span>
            <h2>Published market price</h2>
            <PriceSparkline history={card.priceHistory} />
          </div>
          <div className="content-card">
            <span className="label">Demand and scarcity</span>
            <h2>Market signals</h2>
            <div className="grid two">
              <div className="stat-card">
                <span>Demand score</span>
                <strong>{primary.demandScore}/100</strong>
              </div>
              <div className="stat-card">
                <span>Scarcity score</span>
                <strong>{primary.scarcityScore}/100</strong>
              </div>
            </div>
            <p>
              Pricing uses supply and demand, hard-to-find signals, market rarity,
              card rarity, visible circulation, verified transaction activity,
              and market breadth. No fresh material evidence means zero movement,
              not automatic decline.
            </p>
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="section-head">
          <div>
            <span className="label">Versions</span>
            <h2>Version-specific pricing</h2>
          </div>
        </div>
        <div className="table-wrap version-table-wrap">
          <table className="version-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Identity</th>
                <th>Collector price</th>
                <th>Market index</th>
                <th>Relationship</th>
                <th>Evidence</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {card.versions.map((version) => (
                <tr key={version.id}>
                  <td data-label="Version">{version.versionCode}</td>
                  <td data-label="Identity">
                    {version.language} &middot; {version.region}
                    <br />
                    <span className="muted">{version.verificationStatus}</span>
                  </td>
                  <td data-label="Collector price">
                    <CollectorPrice value={version.collectorPricePhp} compact />
                  </td>
                  <td data-label="Market index">{formatPeso(version.currentPublishedPricePhp)}</td>
                  <td data-label="Relationship">{version.versionRelationship}</td>
                  <td data-label="Evidence">
                    {version.directEvidence} direct &middot; {version.modeledEvidence} modeled
                  </td>
                  <td data-label="State">
                    <span className="pill live">{version.pricingState}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="shell section">
        <div className="grid two">
          <div className="content-card">
            <span className="label">Graded matrix</span>
            <h2>Raw-to-graded reference</h2>
            <p>
              PSA 10 uses 6.00&times;, BGS Pristine 10 uses 6.50&times;, CGC Pristine 10 uses 5.00&times;, and ARS 10 uses 3.50&times;. BGS Black Label requires exact evidence only.
            </p>
          </div>
          <div className="content-card">
            <span className="label">Recent evidence</span>
            <h2>{records.length || "No"} linked records</h2>
            <div className="timeline">
              {(records.length ? records : []).map((record) => (
                <div className="timeline-item" key={record.id}>
                  <strong>
                    {record.marketplace} &middot; {formatPeso(record.phpPrice)}
                  </strong>
                  <br />
                  <span className="muted">
                    {record.date} &middot; {record.classification} &middot; confidence {record.confidence}
                  </span>
                </div>
              ))}
              {!records.length && <p>Evidence can be added without changing this route.</p>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}


