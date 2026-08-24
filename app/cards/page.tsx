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
  "Film Z",
  "KR",
  "SKR",
  "OR",
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
    group?: string;
  };
};

export const dynamic = "force-dynamic";

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const cards = await getCardsWithLivePrices();
  const selectedLine = getProductLineBySlug(searchParams?.line);
  const isFilmZ = searchParams?.group === "film-z";
  const isCoreKingRare = (card: (typeof cards)[number]) =>
    card.productLine === "Formation" && card.catalogueGroup !== "Film Z";
  const visibleCards = isFilmZ
    ? cards.filter((card) => card.catalogueGroup === "Film Z")
    : selectedLine?.code === "Formation"
      ? cards.filter(isCoreKingRare)
      : getCardsByProductLine(cards, selectedLine?.code);
  const wantedLine = productLines.find((line) => line.code === "Wanted");
  const filmZCards = cards.filter((card) => card.catalogueGroup === "Film Z");

  return (
    <section className="shell section">
      <span className="eyebrow">Catalogue</span>
      <h1>Built for King Rare, Wanted, and Film Z.</h1>
      <p>
        King Rare and Wanted are separated at the product-line level, while Film Z
        is a distinct Formation 04 catalogue group, so evidence,
        pricing, and market movement never mix between different AR Carddass lines.
      </p>

      <form className="catalogue-search-inline" action="/search">
        <input name="q" placeholder="Search card code, character, rarity, set, or article" />
        <button className="button secondary" type="submit">Search</button>
      </form>

      <div className="series-switcher" aria-label="Product line filters">
        <a className={`series-chip ${!selectedLine && !isFilmZ ? "active" : ""}`} href="/cards">
          <span>All</span>
          <strong>{cards.length} catalogue cards</strong>
        </a>
        {productLines.map((line) => {
          const lineCards =
            line.code === "Formation"
              ? cards.filter(isCoreKingRare)
              : getCardsByProductLine(cards, line.code);

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
        <a className={`series-chip ${isFilmZ ? "active" : ""}`} href="/cards?group=film-z">
          <span>Film Z</span>
          <strong>{filmZCards.length} catalogue cards</strong>
        </a>
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
