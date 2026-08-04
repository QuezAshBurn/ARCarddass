const kpis = [
  ["Verified transaction activity", "35%"],
  ["Buyer-intent activity", "20%"],
  ["Search demand", "15%"],
  ["Market scarcity", "15%"],
  ["Price momentum", "10%"],
  ["Market breadth", "5%"]
];

const caps = [
  ["No verified sale", "Â±1.5%"],
  ["One independent verified sale", "Â±7.5%"],
  ["Multiple independent verified sales", "Â±12%"],
  ["Major outlier or record event", "Hold for review"]
];

export default function MethodologyPage() {
  return (
    <section className="shell section">
      <span className="eyebrow">Methodology</span>
      <h1>Initial once. Weekly after that. Always auditable.</h1>
      <p>
        AR Carddass separates the opening reference calculation from recurring
        market pricing. The weekly engine never falls back to initialization, and
        high-water evidence remains informational unless the rules explicitly say
        otherwise.
      </p>

      <div className="grid two">
        <div className="content-card">
          <span className="label">One-time initial price</span>
          <h2>Opening reference</h2>
          <p>
            The initial reference is the maximum of credible raw ask, verified raw
            completed sale, exact-version grade-implied raw value, and
            damage-adjusted Near Mint equivalent. After admin approval, it is
            locked.
          </p>
          <pre className="formula">{`Initial Reference Price = max(A, B, C, D)`}</pre>
        </div>
        <div className="content-card">
          <span className="label">Recurring market price</span>
          <h2>Market movement</h2>
          <p>
            Market pricing starts from the current published price. Fresh KPI
            events are processed once, capped by transaction depth, and stored as
            immutable snapshots.
          </p>
          <pre className="formula">{`Calculated Price = Current Published Price Ã— (1 + KPI Movement %)`}</pre>
        </div>
      </div>

      <div className="section">
        <div className="grid two">
          <div className="content-card">
            <span className="label">KPI weights</span>
            <h2>Market Score</h2>
            <div className="table-wrap">
              <table>
                <tbody>
                  {kpis.map(([name, weight]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="content-card">
            <span className="label">Movement caps</span>
            <h2>Volatility control</h2>
            <div className="table-wrap">
              <table>
                <tbody>
                  {caps.map(([name, cap]) => (
                    <tr key={name}>
                      <td>{name}</td>
                      <td>{cap}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="content-card">
        <span className="label">State guard</span>
        <h2>Automatic pricing state machine</h2>
        <pre className="formula">{`UNINITIALIZED -> runInitialPricing
INITIALIZED   -> wait for approval
LIVE          -> runWeeklyMarketPricing
FROZEN        -> collect data only
REBASE_PENDING -> audited rebase only`}</pre>
      </div>
    </section>
  );
}
