import type { CollectorPriceConfidence } from "@/lib/domain/collector-pricing";

type CollectorConfidenceBadgeProps = {
  confidence: CollectorPriceConfidence;
};

export function CollectorConfidenceBadge({ confidence }: CollectorConfidenceBadgeProps) {
  const isInsufficientData = confidence === "INSUFFICIENT_DATA";
  const label = isInsufficientData ? "Insufficient data" : confidence.toLowerCase();

  return (
    <span className={`collector-confidence collector-confidence--${confidence.toLowerCase().replace("_", "-")}`}>
      {isInsufficientData ? (
        <>
          <span>Insufficient</span>
          <span>data</span>
        </>
      ) : label}
    </span>
  );
}
