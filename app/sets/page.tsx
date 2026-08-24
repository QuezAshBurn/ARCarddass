import Link from "next/link";
import { CardFormation } from "@/components/cards/CardFormation";
import { getCardsByProductLine, getProductLineSetLabel, getSetCode } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

const formationSets = ["F01", "F02", "F03", "F04"] as const;
const wantedSets = ["W01", "W02", "W03", "W04"] as const;

export const dynamic = "force-dynamic";

export default async function SetsPage() {
  const cards = await getCardsWithLivePrices();
  const formationCards = getCardsByProductLine(cards, "Formation").filter(
    (card) => card.catalogueGroup !== "Film Z"
  );
  const wantedCards = getCardsByProductLine(cards, "Wanted");
  const filmZCards = cards.filter((card) => card.catalogueGroup === "Film Z");

  return (
    <section className="shell section">
      <span className="eyebrow">Product lines and sets</span>
      <h1>King Rare, Wanted, and Film Z.</h1>
      <p>
        Sets are grouped by AR Carddass product line so King Rare and Wanted use
        the same pricing logic without sharing evidence, pricing history, or
        market movement.
      </p>

      <div className="section-head compact">
        <div>
          <span className="label">Live product line</span>
          <h2>King Rare sets</h2>
        </div>
        <span className="pill live">{formationCards.length} cards tracked</span>
      </div>
      <div className="grid two">
        {formationSets.map((setCode) => {
          const setCards = formationCards.filter((card) => getSetCode(card.cardNumber) === setCode);

          return (
            <Link className="content-card set-panel" data-set={setCode} href={`/sets/${setCode}`} key={setCode}>
              <span className="label">{setCode}</span>
              <h2>{getProductLineSetLabel("Formation", setCode)}</h2>
              <p>{setCards.length} premium launch card{setCards.length === 1 ? "" : "s"} seeded.</p>
              <span className="market-row-note">SEO guide: /cards/formation-{setCode.slice(1)}</span>
            </Link>
          );
        })}
      </div>

      <div className="section-head compact product-line-spacer">
        <div>
          <span className="label">Live product line</span>
          <h2>Wanted sets</h2>
        </div>
        <span className="pill live">{wantedCards.length} cards tracked</span>
      </div>
      <div className="grid two">
        {wantedSets.map((setCode) => {
          const setCards = wantedCards.filter((card) => getSetCode(card.cardNumber) === setCode);

          return (
            <Link className="content-card set-panel" data-line="wanted" href={`/sets/${setCode}`} key={setCode}>
              <span className="label">{setCode}</span>
              <h2>{getProductLineSetLabel("Wanted", setCode)}</h2>
              <p>{setCards.length} Wanted card{setCards.length === 1 ? "" : "s"} tracked.</p>
            </Link>
          );
        })}
      </div>

      <div className="section-head compact product-line-spacer">
        <div>
          <span className="label">Formation 04 catalogue group</span>
          <h2>One Piece Film Z</h2>
        </div>
        <span className="pill review">{filmZCards.length} pricing pending</span>
      </div>
      <div className="grid two">
        <Link className="content-card set-panel" data-set="F04" href="/cards?group=film-z">
          <span className="label">F04 · OR</span>
          <h2>Film Z official rare cards</h2>
          <p>
            {filmZCards.length} supplied scans are catalogued separately while raw-market
            evidence is collected before any price is published.
          </p>
        </Link>
      </div>

      <div className="section">
        <CardFormation cards={formationCards} />
      </div>
    </section>
  );
}
