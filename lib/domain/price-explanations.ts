import type { Card, CardVersion } from "@/lib/data/cards";
import { formatPeso } from "@/lib/data/cards";

export type PriceMovementExplanation = {
  tone: "held" | "up" | "down";
  headline: string;
  summary: string;
  previousPricePhp: number;
  currentPricePhp: number;
  movementPercent: number;
  movementPhp: number;
  signals: {
    label: string;
    value: string;
    note: string;
  }[];
  publicReason: string;
};

function getPreviousPrice(version: CardVersion) {
  const movementPercent = version.weeklyChangePercent;

  if (Number.isFinite(movementPercent) && Math.abs(movementPercent) >= 0.01) {
    const divisor = 1 + movementPercent / 100;

    if (divisor > 0) {
      return Math.round(version.currentPublishedPricePhp / divisor);
    }
  }

  return version.currentPublishedPricePhp - version.weeklyChangePhp;
}

function describeEvidence(version: CardVersion) {
  if (version.verifiedSaleCount > 0) {
    return `${version.verifiedSaleCount} accepted verified sale${
      version.verifiedSaleCount === 1 ? "" : "s"
    }`;
  }

  if (version.resellerAskCount > 0) {
    return `${version.resellerAskCount} active reseller ask${
      version.resellerAskCount === 1 ? "" : "s"
    }, but no accepted sale`;
  }

  return "No accepted fresh price-moving evidence";
}

function describeCollectorPrice(version: CardVersion) {
  if (version.collectorPricePhp) {
    return `${formatPeso(version.collectorPricePhp)} collector estimate`;
  }

  return "Insufficient comparable verified sales";
}

export function buildPriceMovementExplanation(
  card: Card,
  version: CardVersion
): PriceMovementExplanation {
  const movementPercent = Number.isFinite(version.weeklyChangePercent)
    ? version.weeklyChangePercent
    : 0;
  const previousPricePhp = getPreviousPrice(version);
  const movementPhp = version.currentPublishedPricePhp - previousPricePhp;
  const isHeld = Math.abs(movementPercent) < 0.01;
  const tone = isHeld ? "held" : movementPercent > 0 ? "up" : "down";
  const evidenceDescription = describeEvidence(version);
  const pressureDescription = `Demand ${version.demandScore}/100, scarcity ${version.scarcityScore}/100`;
  const collectorDescription = describeCollectorPrice(version);

  const headline = isHeld
    ? "Held by evidence gate"
    : movementPercent > 0
      ? "Moved up after accepted signal"
      : "Moved down after accepted signal";

  const summary = isHeld
    ? `${card.characterName} was checked this pricing slot, but the system did not find enough accepted material evidence to move the public Market Index.`
    : `${card.characterName} moved ${movementPercent > 0 ? "up" : "down"} ${Math.abs(
        movementPercent
      ).toFixed(2)}% after the accepted signals were scored and capped.`;

  const publicReason = isHeld
    ? "The timestamp can update even when price stays still: the engine ran, reviewed available signals, then held the price because the evidence gate did not pass."
    : "The movement is not random: evidence is collected, validated, scored against demand/scarcity/circulation pressure, then capped before publication.";

  return {
    tone,
    headline,
    summary,
    previousPricePhp,
    currentPricePhp: version.currentPublishedPricePhp,
    movementPercent,
    movementPhp,
    publicReason,
    signals: [
      {
        label: "Evidence",
        value: evidenceDescription,
        note:
          version.verifiedSaleCount > 0
            ? "Accepted comparable sale activity can move Collector Price and Market Index."
            : "Asks, rumors, or thin signals stay informational until validated."
      },
      {
        label: "Pressure",
        value: pressureDescription,
        note: "Demand, scarcity, hard-to-find status, rarity, and visible circulation shape the score."
      },
      {
        label: "Collector basis",
        value: collectorDescription,
        note: "Collector Price is separate from Market Index and requires comparable verified sales."
      },
      {
        label: "Guardrail",
        value: isHeld ? "No movement published" : "Movement cap applied",
        note: "Caps prevent one signal from creating casino-style price jumps."
      }
    ]
  };
}

