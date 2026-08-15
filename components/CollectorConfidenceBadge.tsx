import type { CollectorPriceConfidence } from "@/lib/domain/collector-pricing";

type CollectorConfidenceBadgeProps = {
  confidence: CollectorPriceConfidence;
};

export function CollectorConfidenceBadge({ confidence }: CollectorConfidenceBadgeProps) {
  const label = confidence === "INSUFFICIENT_DATA" ? "Insufficient data" : confidence.toLowerCase();

  return (
    <span className={`collector-confidence collector-confidence--${confidence.toLowerCase().replace("_", "-")}`}>
      {label}
    </span>
  );
}
