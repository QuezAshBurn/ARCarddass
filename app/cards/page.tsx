import { CardGrid } from "@/components/CardGrid";
import { getCardsByProductLine, getProductLineBySlug, productLines } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

const filterLabels = [
  "King Rare 01",
  "King Rare 02",
  "King Rare 03",
  "King Rare 04",
  "Wanted 01",
  "Wanted 02",
  "Wanted 03",
  "Wanted 04",
  "KR",
  "SKR",
  "R",
  "UC",
  "C",
  "JP",
  "EN",
  "HK",
  "Tier 1",
  "Pricing live"
];

type CataloguePageProps = {
  searchParams?: {
    line?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const cards = await getCardsWithLivePrices();
  const selectedLine = getProductLineBySlug(searchParams?.line);
  const visibleCards = getCardsByProductLine(cards, selectedLine?.code);
  const wantedLine = productLines.find((line) => line.code === "Wanted");

  return (
    <section className="shell section">
      <span className="eyebrow">Catalogue</span>
      <h1>Built for King Rare and Wanted.</h1>
      <p>
        King Rare and Wanted are separated at the product-line level so evidence,
        pricing, and market movement never mix between different AR Carddass lines.
      </p>

      <div className="series-switcher" aria-label="Product line filters">
        <a className={`series-chip ${!selectedLine ? "active" : ""}`} href="/cards">
          <span>All</span>
          <strong>{cards.length} catalogue cards</strong>
        </a>
        {productLines.map((line) => {
          const lineCards = getCardsByProductLine(cards, line.code);

          return (
            <a
              className={`series-chip ${selectedLine?.code === line.code ? "active" : ""}`}
              href={`/cards?line=${line.slug}`}
              key={line.code}
            >
              <span>{line.shortName}</span>
              <strong>
                {lineCards.length} live cards
              </strong>
            </a>
          );
        })}
      </div>

      <div className="filters" aria-label="Available catalogue filters">
        {filterLabels.map((label) => (
          <span className="filter-chip" key={label}>
            {label}
          </span>
        ))}
      </div>

      {visibleCards.length > 0 ? (
        <CardGrid cards={visibleCards} />
      ) : (
        <div className="content-card coming-soon-panel">
          <span className="label">{wantedLine?.name ?? "Wanted"}</span>
          <h2>No cards match this catalogue filter yet.</h2>
          <p>
            Clear the current product-line filter to view all cards tracked by
            this catalogue.
          </p>
        </div>
      )}
    </section>
  );
}
