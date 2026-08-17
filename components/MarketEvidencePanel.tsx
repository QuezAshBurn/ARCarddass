import { formatPeso } from "@/lib/data/cards";

export type MarketEvidenceItem = {
  id: string;
  marketplace: string;
  sourceUrl: string;
  eventType: string;
  eventAt: string;
  phpAmount: number | null;
  isGraded: boolean;
  grader: string | null;
  grade: string | null;
  rawEquivalentPhp: number | null;
  validationStatus: string;
  notes: string | null;
};

export type CatalogueResearchReference = {
  source: string;
  sourceUrl: string;
  confidence: string | null;
};

type MarketEvidencePanelProps = {
  evidence: MarketEvidenceItem[];
  catalogueReference: CatalogueResearchReference | null;
};

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-PH", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(date);
}

function displayType(item: MarketEvidenceItem) {
  if (item.eventType === "VERIFIED_SALE") return "Sold";
  if (item.eventType === "ACTIVE_LISTING" || item.eventType === "NEW_LISTING") return "Active ask";
  return item.eventType.replaceAll("_", " ").toLowerCase();
}

function gradeLabel(item: MarketEvidenceItem) {
  if (!item.isGraded) return "Raw card";
  return [item.grader, item.grade].filter(Boolean).join(" ") || "Professionally graded";
}

function sourceStatus(item: MarketEvidenceItem) {
  if (item.validationStatus === "ACCEPTED") return "Verified";
  if (item.validationStatus === "REVIEW_REQUIRED") return "Documented / review";
  return item.validationStatus.replaceAll("_", " ");
}

export function MarketEvidencePanel({ evidence, catalogueReference }: MarketEvidencePanelProps) {
  const rawSales = evidence.filter((item) => !item.isGraded && item.eventType === "VERIFIED_SALE");
  const rawAsks = evidence.filter(
    (item) => !item.isGraded && (item.eventType === "ACTIVE_LISTING" || item.eventType === "NEW_LISTING")
  );
  const gradedSales = evidence.filter((item) => item.isGraded && item.eventType === "VERIFIED_SALE");
  const gradedAsks = evidence.filter(
    (item) => item.isGraded && (item.eventType === "ACTIVE_LISTING" || item.eventType === "NEW_LISTING")
  );

  const latestRawSale = rawSales[0];
  const highestRawAsk = [...rawAsks].sort((a, b) => (b.phpAmount ?? 0) - (a.phpAmount ?? 0))[0];
  const latestGradedSale = gradedSales[0];
  const highestGradedAsk = [...gradedAsks].sort((a, b) => (b.phpAmount ?? 0) - (a.phpAmount ?? 0))[0];

  const highlights = [
    ["Latest raw sale", latestRawSale],
    ["Highest raw ask", highestRawAsk],
    ["Latest graded sale", latestGradedSale],
    ["Highest graded ask", highestGradedAsk]
  ] as const;

  return (
    <section className="shell section">
      <div className="content-card market-evidence-panel">
        <span className="label">Market proof</span>
        <h2>See the evidence behind the number.</h2>
        <p>
          Raw and graded cards are shown separately. The Market Index prioritizes recent raw completed sales,
          then raw asks; graded evidence is clearly labelled and is only converted to raw when no raw reference exists.
        </p>

        <div className="market-evidence-highlights">
          {highlights.map(([label, item]) => (
            <div className="market-evidence-highlight" key={label}>
              <span>{label}</span>
              {item ? (
                <>
                  <strong>{item.phpAmount ? formatPeso(item.phpAmount) : "Amount withheld"}</strong>
                  <small>
                    {gradeLabel(item)} &middot; {formatDate(item.eventAt)}
                  </small>
                </>
              ) : (
                <strong className="muted">No recorded evidence</strong>
              )}
            </div>
          ))}
        </div>

        {catalogueReference && (
          <div className="catalogue-research-reference">
            <div>
              <span className="label">Catalogue research link</span>
              <strong>{catalogueReference.source}</strong>
              <p>
                {catalogueReference.confidence ?? "Research reference"}. This is a source to inspect, not a
                completed transaction unless it also appears in the evidence trail below.
              </p>
            </div>
            <a href={catalogueReference.sourceUrl} target="_blank" rel="noreferrer">
              Open research source
            </a>
          </div>
        )}

        {evidence.length > 0 ? (
          <div className="market-evidence-list" aria-label="Market evidence records">
            {evidence.slice(0, 8).map((item) => (
              <article className="market-evidence-item" key={item.id}>
                <div>
                  <span className={item.validationStatus === "ACCEPTED" ? "pill live" : "pill review"}>
                    {sourceStatus(item)}
                  </span>
                  <strong>{displayType(item)}</strong>
                  <p>
                    {gradeLabel(item)} &middot; {formatDate(item.eventAt)} &middot; {item.marketplace}
                  </p>
                </div>
                <div className="market-evidence-price">
                  <strong>{item.phpAmount ? formatPeso(item.phpAmount) : "Amount withheld"}</strong>
                  {item.isGraded && item.rawEquivalentPhp && (
                    <small>Raw equivalent: {formatPeso(item.rawEquivalentPhp)}</small>
                  )}
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    View source
                  </a>
                </div>
                {item.notes && <p className="market-evidence-note">{item.notes}</p>}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-evidence-state">
            <strong>Evidence is still being collected.</strong>
            <p>Once a marketplace event is validated in Supabase, it appears here automatically with its source and date.</p>
          </div>
        )}
      </div>
    </section>
  );
}
