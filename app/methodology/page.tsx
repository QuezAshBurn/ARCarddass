const kpis = [
  ["Supply and demand", "35%"],
  ["Hard-to-find / market rarity", "20%"],
  ["Card rarity tier", "15%"],
  ["Circulation in the market", "15%"],
  ["Verified price momentum", "10%"],
  ["Market breadth and confidence", "5%"]
];

const pricingBasis = [
  [
    "Supply and demand",
    "Buyer interest, verified sales, watcher activity, and demand movement show whether collectors are actively chasing the card."
  ],
  [
    "Hard to find",
    "Cards with fewer credible listings, fewer confirmed sales, and longer gaps between appearances receive stronger scarcity signals."
  ],
  [
    "Market rarity",
    "The system checks how often the card appears in the market before each scheduled update."
  ],
  [
    "Card rarity",
    "The printed rarity and version identity are treated as a baseline collector signal, separate from temporary hype."
  ],
  [
    "Circulation",
    "Visible supply, active listings, and confirmed market circulation help prevent prices from moving randomly."
  ]
];

const caps = [
  ["No verified sale", "±1.5%"],
  ["One independent verified sale", "±7.5%"],
  ["Multiple independent verified sales", "±12%"],
  ["Major outlier or record event", "Hold for review"]
];

export default function MethodologyPage() {
  return (
    <section className="shell section">
      <span className="eyebrow">Methodology</span>
      <h1>Initial once. Checked twice daily. Movement only with evidence.</h1>
      <p>
        AR Carddass separates the opening reference calculation from recurring
        market pricing. Market evidence may be collected frequently, but published
        prices only change when fresh validated evidence materially affects the
        pricing KPIs. No meaningful evidence means no market-price movement.
      </p>

      <div className="content-card">
        <span className="label">Pricing basis</span>
        <h2>Prices are based on market signals, not random changes.</h2>
        <p>
          Before every noon and midnight pricing update, the system reviews the
          evidence behind each card: supply and demand, how hard it is to find,
          rarity in the market, the card rarity itself, and the number of copies
          visibly circulating. Those signals are checked before the price update
          runs, then capped by the volatility rules below. Verified transactions
          influence pricing but do not automatically reset published prices.
        </p>
        <div className="grid three">
          {pricingBasis.map(([name, detail]) => (
            <div className="stat-card" key={name}>
              <span>{name}</span>
              <p>{detail}</p>
            </div>
          ))}
        </div>
      </div>

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
          <pre className="formula">{`Calculated Price = Current Published Price × (1 + KPI Movement %)`}</pre>
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
LIVE          -> runScheduledMarketPricing
FROZEN        -> collect data only
REBASE_PENDING -> audited rebase only`}</pre>
      </div>
    </section>
  );
}
