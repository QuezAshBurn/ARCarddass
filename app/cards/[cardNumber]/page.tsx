import Link from "next/link";
import { notFound } from "next/navigation";
import { CardArt } from "@/components/CardArt";
import { CollectorConfidenceBadge } from "@/components/CollectorConfidenceBadge";
import { CollectorPrice } from "@/components/CollectorPrice";
import { PriceRelationship } from "@/components/PriceRelationship";
import { PriceMovementExplanation } from "@/components/PriceMovementExplanation";
import { PriceSparkline } from "@/components/PriceSparkline";
import { PricingEvidenceSummary } from "@/components/PricingEvidenceSummary";
import { MarketEvidencePanel } from "@/components/MarketEvidencePanel";
import {
  cards as staticCards,
  evidenceRecords,
  formatMarketUpdateAt,
  formatPeso,
  getMarketRange,
  getProductLineSetLabel,
  getPrimaryVersion,
  getSetCode
} from "@/lib/data/cards";
import { getCardWithLivePrices, getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getMarketEvidenceForCard } from "@/lib/data/market-evidence";

type CardDetailPageProps = {
  params: {
    cardNumber: string;
  };
};

export function generateStaticParams() {
  return staticCards
    .filter((card) => card.productLine === "Formation")
    .map((card) => ({ cardNumber: card.cardNumber }));
}

export const dynamic = "force-dynamic";

export default async function CardDetailPage({ params }: CardDetailPageProps) {
  const [card, catalogueCards] = await Promise.all([
    getCardWithLivePrices(params.cardNumber),
    getCardsWithLivePrices()
  ]);

  if (!card) {
    notFound();
  }

  const primary = getPrimaryVersion(card);
  const marketEvidence = await getMarketEvidenceForCard(card.cardNumber);
  const records = evidenceRecords.filter((record) => record.cardNumber === card.cardNumber);
  const isWantedResearch = card.productLine === "Wanted";
  const isPricingPending = primary.pricingState === "UNINITIALIZED";
  const marketRange = getMarketRange(primary);
  const latestSoldAt = formatMarketUpdateAt(primary.latestVerifiedSaleAt);
  const productLineLabel =
    card.catalogueGroup ?? (card.productLine === "Formation" ? "King Rare" : card.productLine);
  const setLabel = card.catalogueGroup ?? getProductLineSetLabel(card.productLine, getSetCode(card.cardNumber));
  const currentCardIndex = catalogueCards.findIndex(
    (catalogueCard) => catalogueCard.cardNumber.toLowerCase() === card.cardNumber.toLowerCase()
  );
  const hasCatalogueNavigation = catalogueCards.length > 1 && currentCardIndex >= 0;
  const previousCard = hasCatalogueNavigation
    ? catalogueCards[(currentCardIndex - 1 + catalogueCards.length) % catalogueCards.length]
    : null;
  const nextCard = hasCatalogueNavigation
    ? catalogueCards[(currentCardIndex + 1) % catalogueCards.length]
    : null;

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
            {productLineLabel} &middot; {setLabel} &middot; {card.rarity} &middot; {card.cardNumber}
          </span>
          <h1>{card.characterName}</h1>
          <p>{card.summary}</p>
          <div className="grid three">
            <div className="stat-card">
              <span>Collector Price</span>
              <strong>
                {isPricingPending ? "Pricing pending" : <CollectorPrice value={primary.collectorPricePhp} compact />}
              </strong>
            </div>
            <div className="stat-card">
              <span>{isPricingPending ? "Market research" : isWantedResearch ? "Research High Ref" : "Market Index"}</span>
              <strong>{isPricingPending ? "Awaiting evidence" : formatPeso(primary.currentPublishedPricePhp)}</strong>
            </div>
            <div className="stat-card">
              <span>Collector confidence</span>
              <strong>
                <CollectorConfidenceBadge confidence={primary.collectorPriceConfidence} />
              </strong>
            </div>
          </div>
          {card.cardStats && (
            <p className="relationship-note">
              Printed stats · HP {card.cardStats.hp} · AP {card.cardStats.ap} · DP {card.cardStats.dp} · SP {card.cardStats.sp}
            </p>
          )}
          {!isPricingPending && (
            <p className="relationship-note">
              <PriceRelationship
                collectorPrice={primary.collectorPricePhp}
                marketPrice={primary.currentPublishedPricePhp}
              />
            </p>
          )}
          {previousCard && nextCard && (
            <nav className="card-detail-navigation" aria-label="Browse card catalogue">
              <Link
                className="card-navigation-link card-navigation-link--previous"
                href={`/cards/${encodeURIComponent(previousCard.cardNumber)}`}
              >
                <span className="card-navigation-direction">&larr; Previous card</span>
                <strong title={previousCard.characterName}>{previousCard.characterName}</strong>
              </Link>
              <Link
                className="card-navigation-link card-navigation-link--next"
                href={`/cards/${encodeURIComponent(nextCard.cardNumber)}`}
              >
                <span className="card-navigation-direction">Next card &rarr;</span>
                <strong title={nextCard.characterName}>{nextCard.characterName}</strong>
              </Link>
            </nav>
          )}
        </div>
      </section>

      <section className="shell section">
        <div className="content-card pricing-summary-card">
          <span className="label">Collector pricing summary</span>
          <h2>Collector Price vs Market Index</h2>
          <p>
            {isPricingPending
              ? "This Film Z card is catalogued from the supplied scan. Pricing stays unpublished until eligible raw-market and sold-listing evidence has been reviewed."
              : isWantedResearch
              ? "Wanted pricing compares three buckets before publishing: sold items, active asking items, and formula-derived raw values such as graded-to-raw conversions. The Market Index uses the highest eligible reference, with thin comps marked for review."
              : "Collector Price estimates what a knowledgeable collector may reasonably pay based mainly on validated comparable sales. Market Index is the broader AR Carddass market price."}
          </p>
          <div className="pricing-summary-grid">
            <span>Collector Price</span>
            <strong>{isPricingPending ? "Pricing pending" : primary.collectorPricePhp ? formatPeso(primary.collectorPricePhp) : "Insufficient data"}</strong>
            <span>Fair Collector Range</span>
            <strong>
              {isPricingPending
                ? "Awaiting verified sales"
                : primary.verifiedSaleLowPhp && primary.verifiedSaleHighPhp
                ? `${formatPeso(primary.verifiedSaleLowPhp)}-${formatPeso(primary.verifiedSaleHighPhp)}`
                : "Insufficient verified sales"}
            </strong>
            <span>Market Index</span>
            <strong>
              {isPricingPending
                ? "Pricing pending"
                : isWantedResearch
                ? `Research high ${formatPeso(primary.currentPublishedPricePhp)}`
                : formatPeso(primary.currentPublishedPricePhp)}
            </strong>
            <span>Low Market</span>
            <strong>{isPricingPending ? "Pricing pending" : formatPeso(marketRange.lowMarketPhp)}</strong>
            <span>High Market</span>
            <strong>{isPricingPending ? "Pricing pending" : formatPeso(marketRange.highMarketPhp)}</strong>
            <span>Quick-Sale Estimate</span>
            <strong>{isPricingPending ? "Awaiting evidence" : primary.quickSalePricePhp ? formatPeso(primary.quickSalePricePhp) : "Unavailable"}</strong>
            <span>Reseller Ask Range</span>
            <strong>
              {isPricingPending
                ? "Awaiting active asks"
                : primary.resellerAskLowPhp && primary.resellerAskHighPhp
                ? `${formatPeso(primary.resellerAskLowPhp)}–${formatPeso(primary.resellerAskHighPhp)}`
                : "No active asks"}
            </strong>
            <span>Collector Tier</span>
            <strong>{isPricingPending ? "Awaiting evidence" : primary.collectorTier ?? "Unavailable"}</strong>
            {isWantedResearch && card.researchPricingConfidence && (
              <>
                <span>Research basis</span>
                <strong>{card.researchPricingConfidence}</strong>
                <span>Source note</span>
                <strong>{card.researchPricingSource ?? "Pending source review"}</strong>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="shell section">
        <div className="grid three">
          <div className="stat-card">
            <span>Initial Reference</span>
              <strong>{isPricingPending ? "Pricing pending" : formatPeso(primary.initialReferencePricePhp)}</strong>
          </div>
          <div className="stat-card">
            <span>High-Water Reference</span>
              <strong>{isPricingPending ? "Pricing pending" : formatPeso(primary.highWaterReferencePhp)}</strong>
          </div>
          <div className="stat-card">
            <span>{isWantedResearch ? "Latest Sold Reference" : "Highest Verified Sale"}</span>
            <strong>
              {isPricingPending
                ? "Awaiting verified sale"
                : primary.highestVerifiedSalePhp > 0
                ? `${formatPeso(primary.highestVerifiedSalePhp)}${isWantedResearch && latestSoldAt ? ` · ${latestSoldAt}` : ""}`
                : isWantedResearch
                  ? "Pending dated sale"
                  : "Pending verification"}
            </strong>
          </div>
        </div>
      </section>

      {!isPricingPending && <section className="shell section">
        <div className="grid two">
          <div className="content-card">
            <PriceMovementExplanation card={card} version={primary} />
          </div>
          <div className="content-card">
            <PricingEvidenceSummary version={primary} />
          </div>
        </div>
      </section>}

      <MarketEvidencePanel
        evidence={marketEvidence.evidence}
        catalogueReference={marketEvidence.catalogueReference}
      />

      {!isPricingPending && <section className="shell section">
        <div className="grid two">
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
      </section>}

      {!isPricingPending ? <section className="shell section">
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
      </section> : <section className="shell section">
        <div className="content-card">
          <span className="label">Market research status</span>
          <h2>Pricing is intentionally unpublished.</h2>
          <p>
            This catalogue entry is ready for evidence collection. The price chart, demand,
            scarcity, and collector estimate will appear only after raw listings and sold
            references have been reviewed and initialized in Supabase.
          </p>
        </div>
      </section>}

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
                  <td data-label="Market index">
                    {version.pricingState === "UNINITIALIZED" ? "Pricing pending" : formatPeso(version.currentPublishedPricePhp)}
                  </td>
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


