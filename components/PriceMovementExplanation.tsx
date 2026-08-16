import type { Card, CardVersion } from "@/lib/data/cards";
import { formatPeso } from "@/lib/data/cards";
import { buildPriceMovementExplanation } from "@/lib/domain/price-explanations";

type PriceMovementExplanationProps = {
  card: Card;
  version: CardVersion;
  compact?: boolean;
};

export function PriceMovementExplanation({
  card,
  version,
  compact = false
}: PriceMovementExplanationProps) {
  const explanation = buildPriceMovementExplanation(card, version);
  const movementLabel =
    explanation.movementPercent >= 0
      ? `+${explanation.movementPercent.toFixed(2)}%`
      : `${explanation.movementPercent.toFixed(2)}%`;

  return (
    <div className={`price-explanation price-explanation--${explanation.tone}`}>
      <div className="price-explanation__head">
        <div>
          <span className="label">Movement explanation</span>
          <h3>{explanation.headline}</h3>
        </div>
        <span className="movement-chip">{movementLabel}</span>
      </div>
      <p>{explanation.summary}</p>

      {!compact && (
        <div className="price-explanation__prices" aria-label="Price movement">
          <span>
            Previous
            <strong>{formatPeso(explanation.previousPricePhp)}</strong>
          </span>
          <span>
            Current
            <strong>{formatPeso(explanation.currentPricePhp)}</strong>
          </span>
          <span>
            Change
            <strong>
              {explanation.movementPhp >= 0 ? "+" : ""}
              {formatPeso(explanation.movementPhp)}
            </strong>
          </span>
        </div>
      )}

      <div className="price-explanation__signals">
        {explanation.signals.map((signal) => (
          <div key={signal.label}>
            <span>{signal.label}</span>
            <strong>{signal.value}</strong>
            {!compact && <small>{signal.note}</small>}
          </div>
        ))}
      </div>
      <p className="price-explanation__reason">{explanation.publicReason}</p>
    </div>
  );
}

