import { CardGrid } from "@/components/CardGrid";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

const filterLabels = [
  "Formation 01",
  "Formation 02",
  "Formation 03",
  "Formation 04",
  "KR",
  "SKR",
  "JP",
  "EN",
  "HK",
  "Tier 1",
  "Pricing live"
];

export const dynamic = "force-dynamic";

export default async function CataloguePage() {
  const cards = await getCardsWithLivePrices();

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
