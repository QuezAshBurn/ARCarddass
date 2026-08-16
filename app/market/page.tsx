import { MarketAutomationStatus } from "@/components/MarketAutomationStatus";
import { MarketTable } from "@/components/MarketTable";
import { MarketWatchExplainer } from "@/components/MarketWatchExplainer";
import { getCardsByProductLine, getMarketSummary, getProductLineBySlug, productLines } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { ensureMarketPricesFresh } from "@/lib/server/market-price-cron";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type MarketPageProps = {
  searchParams?: {
    line?: string;
    rarity?: string;
    sort?: string;
  };
};

function sortCards(cards: Awaited<ReturnType<typeof getCardsWithLivePrices>>, sort?: string) {
  const sorted = [...cards];

  switch (sort) {
    case "collector-low":
      return sorted.sort(
        (a, b) =>
          (a.versions[0].collectorPricePhp ?? Number.MAX_SAFE_INTEGER) -
          (b.versions[0].collectorPricePhp ?? Number.MAX_SAFE_INTEGER)
      );
    case "market":
      return sorted.sort(
        (a, b) => b.versions[0].currentPublishedPricePhp - a.versions[0].currentPublishedPricePhp
      );
    case "gap":
      return sorted.sort((a, b) => {
        const aGap = Math.abs((a.versions[0].collectorPricePhp ?? a.versions[0].currentPublishedPricePhp) - a.versions[0].currentPublishedPricePhp);
        const bGap = Math.abs((b.versions[0].collectorPricePhp ?? b.versions[0].currentPublishedPricePhp) - b.versions[0].currentPublishedPricePhp);
        return bGap - aGap;
      });
    case "demand":
      return sorted.sort((a, b) => b.versions[0].demandScore - a.versions[0].demandScore);
    case "scarcity":
      return sorted.sort((a, b) => b.versions[0].scarcityScore - a.versions[0].scarcityScore);
    case "verified-sales":
      return sorted.sort((a, b) => b.versions[0].verifiedSaleCount - a.versions[0].verifiedSaleCount);
    case "collector-high":
    default:
      return sorted.sort(
        (a, b) => (b.versions[0].collectorPricePhp ?? 0) - (a.versions[0].collectorPricePhp ?? 0)
      );
  }
}

export default async function MarketPage({ searchParams }: MarketPageProps) {
  await ensureMarketPricesFresh();
  const cards = await getCardsWithLivePrices();
  const selectedLine = getProductLineBySlug(searchParams?.line);
  const productLineCards = getCardsByProductLine(cards, selectedLine?.code ?? "Formation");
  const rarityFilter = searchParams?.rarity?.toUpperCase();
  const filteredCards =
    rarityFilter === "KR" || rarityFilter === "SKR"
      ? productLineCards.filter((card) => card.rarity === rarityFilter)
      : productLineCards;
  const visibleCards = sortCards(filteredCards, searchParams?.sort);
  const summary = getMarketSummary(visibleCards);
  const lineQuery = selectedLine ? `line=${selectedLine.slug}&` : "";

  return (
    <section className="shell section">
      <div className="section-head">
        <div>
          <span className="eyebrow">Market dashboard</span>
          <h1>Twice-daily checks, evidence-based movement.</h1>
          <p>
            This view ranks prices, demand, scarcity, card rarity, visible circulation,
            and latest movement across all live premium launch cards. The market can
            be checked every noon and midnight, but prices only move when fresh
            validated evidence materially affects the KPIs.
          </p>
        </div>
        <span className="pill">{summary.lastMarketUpdate}</span>
      </div>
      <div className="series-switcher" aria-label="Market product line filters">
        <a className={`series-chip ${!selectedLine ? "active" : ""}`} href="/market">
          <span>Live market</span>
          <strong>{getCardsByProductLine(cards, "Formation").length} tracked cards</strong>
        </a>
        {productLines.map((line) => {
          const lineCards = getCardsByProductLine(cards, line.code);

          return (
            <a
              className={`series-chip ${selectedLine?.code === line.code ? "active" : ""}`}
              href={`/market?line=${line.slug}`}
              key={line.code}
            >
              <span>{line.shortName}</span>
              <strong>{lineCards.length} tracked</strong>
            </a>
          );
        })}
      </div>
      <div className="filters market-filters" aria-label="Market filters">
        <a className={`filter-chip ${!rarityFilter ? "active" : ""}`} href={selectedLine ? `/market?line=${selectedLine.slug}` : "/market"}>
          All premium
        </a>
        <a className={`filter-chip ${rarityFilter === "KR" ? "active" : ""}`} href={selectedLine ? `/market?line=${selectedLine.slug}&rarity=KR` : "/market?rarity=KR"}>
          King Rare / KR
        </a>
        <a className={`filter-chip ${rarityFilter === "SKR" ? "active" : ""}`} href={selectedLine ? `/market?line=${selectedLine.slug}&rarity=SKR` : "/market?rarity=SKR"}>
          Secret KR / SKR
        </a>
        <a className="filter-chip" href={`/market?${lineQuery}sort=collector-high`}>
          Collector high → low
        </a>
        <a className="filter-chip" href={`/market?${lineQuery}sort=verified-sales`}>
          Most verified sales
        </a>
        <a className="filter-chip" href={`/market?${lineQuery}sort=gap`}>
          Largest collector/index gap
        </a>
      </div>
      {visibleCards.length > 0 ? (
        <>
          <div className="grid three">
            <div className="content-card">
              <span className="label">Most demanded</span>
              <h2>{summary.mostDemanded[0].card.characterName}</h2>
              <p>{summary.mostDemanded[0].version.demandScore}/100 demand score.</p>
            </div>
            <div className="content-card">
              <span className="label">Scarcest</span>
              <h2>{summary.scarcest[0].card.characterName}</h2>
              <p>{summary.scarcest[0].version.scarcityScore}/100 scarcity score.</p>
            </div>
            <div className="content-card">
              <span className="label">Softest movement</span>
              <h2>{summary.biggestDecliners[0].card.characterName}</h2>
              <p>{summary.biggestDecliners[0].version.weeklyChangePercent.toFixed(2)}% this update.</p>
            </div>
          </div>
          <div style={{ height: 22 }} />
          <MarketAutomationStatus cards={visibleCards} lastMarketUpdate={summary.lastMarketUpdate} />
          <div style={{ height: 22 }} />
          <MarketWatchExplainer cards={visibleCards} lastMarketUpdate={summary.lastMarketUpdate} />
          <div style={{ height: 22 }} />
          <MarketTable cards={visibleCards} />
        </>
      ) : (
        <div className="content-card coming-soon-panel">
          <span className="label">{selectedLine?.shortName ?? "Market"}</span>
          <h2>No cards match this market filter yet.</h2>
          <p>
            Clear the current filter or choose another product line to view the
            same demand, scarcity, market range, and evidence logic.
          </p>
        </div>
      )}
    </section>
  );
}
