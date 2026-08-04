import { notFound } from "next/navigation";
import { CardArt } from "@/components/CardArt";
import { PriceSparkline } from "@/components/PriceSparkline";
import { evidenceRecords, findCard, formatPeso, getPrimaryVersion } from "@/lib/data/cards";

type CardDetailPageProps = {
  params: {
    cardNumber: string;
  };
};

export function generateStaticParams() {
  return ["F01-01", "F01-37", "F02-20", "F02-24", "F03-03", "F03-13", "F04-13", "F04-27"].map(
    (cardNumber) => ({ cardNumber })
  );
}

export default function CardDetailPage({ params }: CardDetailPageProps) {
  const card = findCard(params.cardNumber);

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
            {card.formationSet} Â· {card.rarity} Â· {card.cardNumber}
          </span>
          <h1>{card.characterName}</h1>
          <p>{card.summary}</p>
          <div className="grid three">
            <div className="stat-card">
              <span>Current market price</span>
              <strong>{formatPeso(primary.currentPublishedPricePhp)}</strong>
            </div>
            <div className="stat-card">
              <span>Weekly movement</span>
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
              Demand uses verified transaction activity, buyer-intent deltas,
              search demand, scarcity, momentum, and market breadth. No fresh
              material evidence means zero movement, not automatic decline.
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
                    {version.language} Â· {version.region}
                    <br />
                    <span className="muted">{version.verificationStatus}</span>
                  </td>
                  <td>{formatPeso(version.currentPublishedPricePhp)}</td>
                  <td>{version.versionRelationship}</td>
                  <td>
                    {version.directEvidence} direct Â· {version.modeledEvidence} modeled
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
              PSA 10 uses 6.00Ã—, BGS Pristine 10 uses 6.50Ã—, CGC Pristine 10 uses
              5.00Ã—, and ARS 10 uses 3.50Ã—. BGS Black Label requires exact
              evidence only.
            </p>
          </div>
          <div className="content-card">
            <span className="label">Recent evidence</span>
            <h2>{records.length || "No"} linked records</h2>
            <div className="timeline">
              {(records.length ? records : []).map((record) => (
                <div className="timeline-item" key={record.id}>
                  <strong>
                    {record.marketplace} Â· {formatPeso(record.phpPrice)}
                  </strong>
                  <br />
                  <span className="muted">
                    {record.date} Â· {record.classification} Â· confidence {record.confidence}
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


