import { formatPeso } from "@/lib/data/cards";

type PriceRangeProps = {
  low: number | null;
  high: number | null;
  count: number;
  singularLabel: string;
  pluralLabel: string;
  emptyLabel: string;
};

function formatRange(low: number | null, high: number | null) {
  if (!low || !high) return null;
  if (low === high) return formatPeso(low);

  return `${formatPeso(low)}–${formatPeso(high)}`;
}

export function PriceRange({
  low,
  high,
  count,
  singularLabel,
  pluralLabel,
  emptyLabel
}: PriceRangeProps) {
  const range = formatRange(low, high);

  if (!range || count === 0) {
    return <span className="price-range-empty">{emptyLabel}</span>;
  }

  return (
    <span className="price-range">
      {range}
      <br />
      <small>{count === 1 ? `1 ${singularLabel}` : `${count} ${pluralLabel}`}</small>
    </span>
  );
}
