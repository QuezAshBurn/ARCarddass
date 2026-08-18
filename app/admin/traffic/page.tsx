import { getTrafficFilters, getTrafficReport } from "@/lib/server/traffic-report";

type TrafficReportPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

function number(value: number) {
  return new Intl.NumberFormat("en-PH").format(value);
}

export const dynamic = "force-dynamic";

export default async function TrafficReportPage({ searchParams }: TrafficReportPageProps) {
  const reportToken = process.env.TRAFFIC_REPORT_TOKEN;
  const suppliedToken = typeof searchParams.token === "string" ? searchParams.token : "";

  if (!reportToken || suppliedToken !== reportToken) {
    return (
      <section className="shell section">
        <div className="content-card traffic-access-card">
          <span className="label">Private report</span>
          <h1>Traffic reporting is protected.</h1>
          <p>
            Set <code>TRAFFIC_REPORT_TOKEN</code> in Vercel, then open this page with
            the matching <code>?token=</code> value. The token is never exposed in the public site.
          </p>
        </div>
      </section>
    );
  }

  const filters = getTrafficFilters(searchParams);
  const report = await getTrafficReport(filters);
  const reportQuery = `token=${encodeURIComponent(suppliedToken)}`;

  return (
    <section className="shell section traffic-report">
      <div className="section-head">
        <div>
          <span className="eyebrow">Private analytics</span>
          <h1>Traffic report</h1>
          <p>Visits and unique visitors are shown in Philippine time (PHT).</p>
        </div>
      </div>

      <form className="content-card traffic-filters" method="get">
        <input type="hidden" name="token" value={suppliedToken} />
        <label>
          From
          <input name="from" type="date" defaultValue={filters.from} />
        </label>
        <label>
          To
          <input name="to" type="date" defaultValue={filters.to} />
        </label>
        <label>
          Country
          <select name="country" defaultValue={filters.country}>
            <option value="">All locations</option>
            {report.countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <button className="button primary" type="submit">Apply filters</button>
      </form>

      {report.error ? (
        <div className="content-card traffic-error">
          <span className="label">Data source</span>
          <h2>Traffic data is not ready yet.</h2>
          <p>{report.error}</p>
        </div>
      ) : (
        <>
          <div className="grid three traffic-summary">
            <div className="stat-card"><span>Page visits</span><strong>{number(report.totalVisits)}</strong></div>
            <div className="stat-card"><span>Unique visitors</span><strong>{number(report.uniqueVisitors)}</strong></div>
            <div className="stat-card"><span>Locations</span><strong>{number(report.locations.length)}</strong></div>
          </div>

          <div className="grid two">
            <TrafficTable title="Visits by day" rows={report.daily} empty="No visits in this date range yet." />
            <TrafficTable title="Visits by location" rows={report.locations} empty="Location data will appear when Vercel sends geo headers." />
          </div>
          <TrafficTable title="Most visited pages" rows={report.pages} empty="No pages recorded yet." />
        </>
      )}

      <p className="traffic-privacy-note">
        Privacy note: this report records a random visitor identifier and coarse Vercel location headers only. It does not store IP addresses, names, or precise addresses. Visitors with Do Not Track enabled are not recorded.
      </p>
      <a className="traffic-hidden-link" href={`/admin/traffic?${reportQuery}`}>Refresh report</a>
    </section>
  );
}

function TrafficTable({ title, rows, empty }: { title: string; rows: { label: string; visits: number; visitors: number }[]; empty: string }) {
  return (
    <div className="content-card traffic-table-card">
      <span className="label">Traffic breakdown</span>
      <h2>{title}</h2>
      {rows.length === 0 ? <p className="muted">{empty}</p> : (
        <div className="table-wrap">
          <table className="traffic-table">
            <thead><tr><th>Item</th><th>Visits</th><th>Visitors</th></tr></thead>
            <tbody>{rows.map((row) => (
              <tr key={row.label}><td>{row.label}</td><td>{number(row.visits)}</td><td>{number(row.visitors)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
