type PriceRelationshipProps = {
  collectorPrice: number | null;
  marketPrice: number;
};

export function PriceRelationship({ collectorPrice, marketPrice }: PriceRelationshipProps) {
  if (!collectorPrice || !marketPrice) {
    return <span className="muted">Collector Price unavailable</span>;
  }

  const difference = ((collectorPrice - marketPrice) / marketPrice) * 100;
  const absolute = Math.abs(difference);

  if (absolute < 0.5) {
    return <span>Collector Price is aligned with Market Index</span>;
  }

  return (
    <span>
      Collector Price is {absolute.toFixed(1)}% {difference > 0 ? "above" : "below"} Market Index
    </span>
  );
}
