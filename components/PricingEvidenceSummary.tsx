import type { CardVersion } from "@/lib/data/cards";
import { formatPeso } from "@/lib/data/cards";

type PricingEvidenceSummaryProps = {
  version: CardVersion;
};

function formatNullablePeso(value: number | null) {
  return value ? formatPeso(value) : "Unavailable";
}

export function PricingEvidenceSummary({ version }: PricingEvidenceSummaryProps) {
  const hasHighAskWarning =
    version.collectorPricePhp &&
    version.resellerAskMedianPhp &&
    version.resellerAskMedianPhp >= version.collectorPricePhp * 1.25;

  return (
    <div className="pricing-evidence-summary">
      <h3>Why this Collector Price?</h3>
      <ul>
        <li>
          {version.verifiedSaleCount === 0
            ? "No accepted comparable verified sales in the current evidence window"
            : `${version.verifiedSaleCount} accepted verified sale${version.verifiedSaleCount === 1 ? "" : "s"} in the evidence window`}
        </li>
        <li>Median verified sale: {formatNullablePeso(version.verifiedSaleMedianPhp)}</li>
        <li>
          Observed sale range: {formatNullablePeso(version.verifiedSaleLowPhp)}–
          {formatNullablePeso(version.verifiedSaleHighPhp)}
        </li>
        <li>
          Active reseller asks: {version.resellerAskCount} listing
          {version.resellerAskCount === 1 ? "" : "s"}
        </li>
        <li>
          Ask range: {formatNullablePeso(version.resellerAskLowPhp)}–
          {formatNullablePeso(version.resellerAskHighPhp)}
        </li>
        <li>Collector confidence: {version.collectorPriceConfidence}</li>
      </ul>
      {hasHighAskWarning && (
        <p className="warning-note">
          Seller asks are currently well above verified collector activity.
        </p>
      )}
      {version.verifiedSaleCount === 0 && version.resellerAskCount > 0 && (
        <p className="warning-note">
          Active listings are visible, but asking prices are not treated as completed market sales.
        </p>
      )}
    </div>
  );
}
