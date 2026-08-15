import { evidenceRecords, formatPeso } from "@/lib/data/cards";
import { getPublicSupabaseClient } from "@/lib/database/supabase";

type MarketEventRow = {
  id: string;
  card_code: string;
  version: string;
  marketplace: string;
  event_type: string;
  event_at: string;
  currency: string;
  native_amount: number | string | null;
  php_amount: number | string | null;
  listing_price: number | string | null;
  sale_price: number | string | null;
  condition: string | null;
  validation_status: string;
  evidence_confidence: number | null;
  notes: string | null;
};

async function getEvidenceRows() {
  const supabase = getPublicSupabaseClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("market_events")
    .select(
      "id,card_code,version,marketplace,event_type,event_at,currency,native_amount,php_amount,listing_price,sale_price,condition,validation_status,evidence_confidence,notes"
    )
    .order("event_at", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("Could not load market_events for evidence page:", error.message);
    return null;
  }

  return (data ?? []) as MarketEventRow[];
}

function asNumber(value: number | string | null | undefined) {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : null;
}

export default async function EvidencePage() {
  const marketEvents = await getEvidenceRows();

  return (
    <section className="shell section">
      <span className="eyebrow">Evidence ledger</span>
      <h1>Every price claim keeps its receipt.</h1>
      <p>
        Public evidence includes source, status, PHP value, version identity,
        confidence, and whether it affected initialization, a scheduled KPI update,
        or was held for review. Listing text is treated as data, never as
        instructions for changing price.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Evidence</th>
              <th>Source</th>
              <th>Status</th>
              <th>Value</th>
              <th>Signals</th>
              <th>Confidence</th>
              <th>Affected</th>
            </tr>
          </thead>
          <tbody>
            {marketEvents && marketEvents.length > 0
              ? marketEvents.map((event) => {
                  const phpAmount = asNumber(event.php_amount ?? event.sale_price ?? event.listing_price);
                  const nativeAmount = asNumber(event.native_amount);

                  return (
                    <tr key={event.id}>
                      <td>
                        <strong>{event.card_code}</strong>
                        <br />
                        <span className="muted">
                          {event.version} · {event.event_type} · {event.condition ?? "UNKNOWN"}
                        </span>
                      </td>
                      <td>{event.marketplace}</td>
                      <td>
                        <span className={event.validation_status === "REVIEW_REQUIRED" ? "pill review" : "pill live"}>
                          {event.validation_status}
                        </span>
                      </td>
                      <td>
                        {phpAmount ? formatPeso(phpAmount) : "No amount"}
                        <br />
                        <span className="muted">
                          {event.currency} {nativeAmount ? nativeAmount.toLocaleString() : "—"}
                        </span>
                      </td>
                      <td>{new Date(event.event_at).toLocaleDateString("en-PH")}</td>
                      <td>{event.evidence_confidence ?? "—"}</td>
                      <td>{event.notes ?? "market-event ledger"}</td>
                    </tr>
                  );
                })
              : evidenceRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <strong>{record.cardName}</strong>
                      <br />
                      <span className="muted">
                        {record.cardNumber} · {record.versionCode} · {record.classification}
                      </span>
                    </td>
                    <td>{record.marketplace}</td>
                    <td>
                      <span className={record.status === "review" ? "pill review" : "pill live"}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      {formatPeso(record.phpPrice)}
                      <br />
                      <span className="muted">
                        {record.originalCurrency} {record.originalPrice.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      {record.watchers ? `${record.watchers} watchers` : "—"}
                      {record.bids ? ` · ${record.bids} bids` : ""}
                    </td>
                    <td>{record.confidence}</td>
                    <td>{record.affected}</td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
