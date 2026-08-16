import type { Card } from "@/lib/data/cards";
import { formatMarketUpdateAt, getPrimaryVersion } from "@/lib/data/cards";

type MarketAutomationStatusProps = {
  cards: Card[];
  lastMarketUpdate: string;
};

function getNextPricingSlot(now = new Date()) {
  const manilaFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = manilaFormatter.formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  const year = Number(get("year"));
  const month = Number(get("month")) - 1;
  const day = Number(get("day"));
  const hour = Number(get("hour"));
  const nextLocalHour = hour < 12 ? 12 : 24;
  const manilaOffsetMs = 8 * 60 * 60 * 1000;
  const utcDate = new Date(Date.UTC(year, month, day, nextLocalHour) - manilaOffsetMs);

  return formatMarketUpdateAt(utcDate.toISOString()) ?? "Next slot pending";
}

export function MarketAutomationStatus({ cards, lastMarketUpdate }: MarketAutomationStatusProps) {
  const primaryRows = cards.map((card) => getPrimaryVersion(card));
  const movedCount = primaryRows.filter((version) => Math.abs(version.weeklyChangePercent) >= 0.01).length;
  const heldCount = Math.max(0, primaryRows.length - movedCount);
  const acceptedSaleCount = primaryRows.reduce((total, version) => total + version.verifiedSaleCount, 0);
  const askCount = primaryRows.reduce((total, version) => total + version.resellerAskCount, 0);

  return (
    <div className="automation-status">
      <div className="automation-status__main">
        <span className="pulse-dot" aria-hidden="true" />
        <span className="label">Live automation status</span>
        <h2>Runs twice daily. Publishes only when evidence passes.</h2>
        <p>
          The engine checks at noon and midnight PHT. A fresh timestamp means the
          pricing job ran; price movement still requires accepted sale or market
          evidence.
        </p>
      </div>
      <div className="automation-status__cards">
        <div>
          <span>Latest run</span>
          <strong>{lastMarketUpdate.replace("Updated ", "")}</strong>
          <small>{movedCount} moved · {heldCount} held</small>
        </div>
        <div>
          <span>Next scheduled check</span>
          <strong>{getNextPricingSlot()}</strong>
          <small>12:00 NN / 12:00 MN PHT cadence</small>
        </div>
        <div>
          <span>Evidence queue</span>
          <strong>{acceptedSaleCount} sales · {askCount} asks</strong>
          <small>Sales can price; asks stay advisory until sold.</small>
        </div>
      </div>
    </div>
  );
}

