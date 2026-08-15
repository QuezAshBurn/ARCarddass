import { formatPeso } from "@/lib/data/cards";

type CollectorPriceProps = {
  value: number | null;
  compact?: boolean;
};

export function CollectorPrice({ value, compact = false }: CollectorPriceProps) {
  if (!value) {
    return (
      <span className="collector-price collector-price--empty">
        Insufficient data
        {!compact && (
          <>
            <br />
            <small>Needs accepted verified sales</small>
          </>
        )}
      </span>
    );
  }

  return (
    <span className="collector-price">
      {formatPeso(value)}
      {!compact && (
        <>
          <br />
          <small>Collector estimate</small>
        </>
      )}
    </span>
  );
}
