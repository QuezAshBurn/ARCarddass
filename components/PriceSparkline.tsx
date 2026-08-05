import type { PricePoint } from "@/lib/data/cards";
import { formatPeso } from "@/lib/data/cards";

type PriceSparklineProps = {
  history: PricePoint[];
};

const pricingBasis = [
  "Supply and demand",
  "Hard-to-find signals",
  "Market rarity",
  "Card rarity",
  "Visible circulation"
];

export function PriceSparkline({ history }: PriceSparklineProps) {
  const width = 700;
  const height = 220;
  const padding = 28;
  const values = history.map((point) => point.pricePhp);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const points = history.map((point, index) => {
    const x =
      padding + (index / Math.max(1, history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((point.pricePhp - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className="price-chart">
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img">
        <title>Price history chart</title>
        <rect width={width} height={height} rx="22" fill="rgba(255,255,255,0.62)" />
        <polyline
          fill="none"
          points={line}
          stroke="#2454ff"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {points.map((point) => (
          <g key={point.week}>
            <circle cx={point.x} cy={point.y} fill="#d9253f" r="5" />
            <text fill="#626a7f" fontSize="12" textAnchor="middle" x={point.x} y={height - 8}>
              {point.week}
            </text>
          </g>
        ))}
        <text fill="#0c1020" fontSize="14" fontWeight="700" x={padding} y={24}>
          {formatPeso(values[values.length - 1])}
        </text>
        <text fill="#626a7f" fontSize="12" x={padding} y={44}>
          8-update published market price
        </text>
      </svg>

      <div className="chart-basis" aria-label="Pricing basis checked before every card update">
        <div>
          <span className="label">Before every update</span>
          <p>
            The chart movement is based on market signals reviewed before pricing runs,
            not random adjustments.
          </p>
        </div>
        <ul>
          {pricingBasis.map((basis) => (
            <li key={basis}>{basis}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}