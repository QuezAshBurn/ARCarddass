import { notFound } from "next/navigation";
import { CardArt } from "@/components/CardArt";
import { PriceSparkline } from "@/components/PriceSparkline";
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
              <span>Current market price</span>
              <strong>{formatPeso(primary.currentPublishedPricePhp)}</strong>
            </div>
            <div className="stat-card">
              <span>Per-update movement</span>
              <strong className={primary.weeklyChangePercent >= 0 ? "positive" : "negative"}>
                {primary.weeklyChangePercent >= 0 ? "+" : ""}
                {primary.weeklyChangePercent.toFixed(2)}%
              </strong>
            </div>
            <div className="stat-card">
              <span>Confidence</span>
              <strong>{primary.confidence}</strong>
            </div>
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
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Version</th>
                <th>Identity</th>
                <th>Market price</th>
                <th>Relationship</th>
                <th>Evidence</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {card.versions.map((version) => (
                <tr key={version.id}>
                  <td>{version.versionCode}</td>
                  <td>
                    {version.language} &middot; {version.region}
                    <br />
                    <span className="muted">{version.verificationStatus}</span>
                  </td>
                  <td>{formatPeso(version.currentPublishedPricePhp)}</td>
                  <td>{version.versionRelationship}</td>
                  <td>
                    {version.directEvidence} direct &middot; {version.modeledEvidence} modeled
                  </td>
                  <td>
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


