import type { MarketEvidenceItem } from "@/components/MarketEvidencePanel";
import { formatPeso } from "@/lib/data/cards";

type MarketTimelineProps = {
  evidence: MarketEvidenceItem[];
};

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unknown"
    : new Intl.DateTimeFormat("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
}

function badgeLabel(item: MarketEvidenceItem) {
  if (item.validationStatus === "REVIEW_REQUIRED") return "REVIEW REQUIRED";
  if (item.eventType === "VERIFIED_SALE") return "VERIFIED SALE";
  if (item.eventType === "ACTIVE_LISTING" || item.eventType === "NEW_LISTING") return "ACTIVE ASK";
  return item.eventType.replaceAll("_", " ");
}

export function MarketTimeline({ evidence }: MarketTimelineProps) {
  return (
    <section className="shell section">
      <div className="content-card market-timeline">
        <span className="label">Evidence timeline</span>
        <h2>Market events stay dated.</h2>
        {evidence.length ? (
          <div className="market-timeline-list">
            {evidence.slice(0, 10).map((item) => (
              <article className="market-timeline-item" key={item.id}>
                <div>
                  <time>{formatDate(item.eventAt)}</time>
                  <span className={item.validationStatus === "ACCEPTED" ? "pill live" : "pill review"}>
                    {badgeLabel(item)}
                  </span>
                </div>
                <strong>{item.marketplace}</strong>
                <p>
                  {item.phpAmount ? formatPeso(item.phpAmount) : "Amount withheld"}
                  {item.isGraded ? ` · ${[item.grader, item.grade].filter(Boolean).join(" ")}` : " · raw"}
                  {item.rawEquivalentPhp ? ` · raw equivalent ${formatPeso(item.rawEquivalentPhp)}` : ""}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p>Validated sales, active asks, and review-required records will appear here once Supabase has evidence for this card.</p>
        )}
      </div>
    </section>
  );
}
