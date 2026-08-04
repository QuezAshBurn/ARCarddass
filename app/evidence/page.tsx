import { evidenceRecords, formatPeso } from "@/lib/data/cards";

export default function EvidencePage() {
  return (
    <section className="shell section">
      <span className="eyebrow">Evidence ledger</span>
      <h1>Every price claim keeps its receipt.</h1>
      <p>
        Public evidence includes source, status, PHP value, version identity,
        confidence, and whether it affected initialization, a weekly KPI update,
        or was held for review.
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
            {evidenceRecords.map((record) => (
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
