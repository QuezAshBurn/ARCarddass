const adminSections = [
  "Evidence awaiting review",
  "Anomaly queue",
  "Market calculation preview",
  "Active overrides",
  "Frozen card versions",
  "Source health",
  "Job runs",
  "Audit log"
];

export default function AdminPage() {
  return (
    <section className="shell section">
      <span className="eyebrow">Admin shell</span>
      <h1>Controls are scoped, audited, and reversible.</h1>
      <p>
        This page is the product shell for Supabase-authenticated admin tools.
        Mutation routes should preserve source evidence, write audit logs, and
        disclose admin-adjusted prices publicly.
      </p>
      <div className="grid cards">
        {adminSections.map((section) => (
          <div className="content-card" key={section}>
            <span className="label">Admin</span>
            <h3>{section}</h3>
            <p>Ready for authenticated workflow implementation.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
