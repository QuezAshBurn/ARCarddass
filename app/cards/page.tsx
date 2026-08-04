import { CardGrid } from "@/components/CardGrid";
import { cards } from "@/lib/data/cards";

const filterLabels = [
  "Formation 01",
  "Formation 02",
  "Formation 03",
  "Formation 04",
  "KR",
  "SKR",
  "JP",
  "EN",
  "CN",
  "Tier 1",
  "Pricing live"
];

export default function CataloguePage() {
  return (
    <section className="shell section">
      <span className="eyebrow">Catalogue</span>
      <h1>Built for all Formation cards, launching with eight.</h1>
      <p>
        Filters are represented as data-first chips so the site can expand beyond
        KR/SKR without route or component redesign.
      </p>
      <div className="filters" aria-label="Available catalogue filters">
        {filterLabels.map((label) => (
          <span className="filter-chip" key={label}>
            {label}
          </span>
        ))}
      </div>
      <CardGrid cards={cards} />
    </section>
  );
}
