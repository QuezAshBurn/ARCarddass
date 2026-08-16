import Link from "next/link";
import { CardFormation } from "@/components/cards/CardFormation";
import { getCardsByProductLine, getProductLineSetLabel, getSetCode } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

const formationSets = ["F01", "F02", "F03", "F04"] as const;
const wantedPreviewSets = ["W01", "W02"] as const;

export const dynamic = "force-dynamic";

export default async function SetsPage() {
  const cards = await getCardsWithLivePrices();
  const formationCards = getCardsByProductLine(cards, "Formation");

  return (
    <section className="shell section">
      <span className="eyebrow">Product lines and sets</span>
      <h1>Formation is live. Wanted is staged next.</h1>
      <p>
        Sets are grouped by AR Carddass product line so Wanted can be added later
        without sharing evidence, pricing history, or market movement with Formation.
      </p>

      <div className="section-head compact">
        <div>
          <span className="label">Live product line</span>
          <h2>Formation sets</h2>
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
            </Link>
          );
        })}
      </div>

      <div className="section-head compact product-line-spacer">
        <div>
          <span className="label">Coming soon</span>
          <h2>Wanted sets</h2>
        </div>
        <span className="pill review">Pricing isolated</span>
      </div>
      <div className="grid two">
        {wantedPreviewSets.map((setCode) => (
          <div className="content-card set-panel coming-soon-panel" data-line="wanted" key={setCode}>
            <span className="label">{setCode}</span>
            <h2>{getProductLineSetLabel("Wanted", setCode)}</h2>
            <p>
              Reserved for Wanted cards. Evidence added here will affect Wanted only,
              not Formation cards with the same character.
            </p>
          </div>
        ))}
      </div>

      <div className="section">
        <CardFormation cards={formationCards} />
      </div>
    </section>
  );
}

