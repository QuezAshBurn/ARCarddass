import Link from "next/link";
import { CardFormation } from "@/components/cards/CardFormation";
import { getSetCode } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

const sets = ["F01", "F02", "F03", "F04"] as const;

export const dynamic = "force-dynamic";

export default async function SetsPage() {
  const cards = await getCardsWithLivePrices();

  return (
    <section className="shell section">
      <span className="eyebrow">Formation sets</span>
      <h1>Set identity without official package art.</h1>
      <p>
        Each set uses original energy panels and color tokens inspired by the
        Formation-era visual language. Official reference images stay out of the
        public bundle unless cleared.
      </p>
      <div className="grid two">
        {sets.map((setCode) => {
          const setCards = cards.filter((card) => getSetCode(card.cardNumber) === setCode);

          return (
            <Link className="content-card set-panel" data-set={setCode} href={`/sets/${setCode}`} key={setCode}>
              <span className="label">{setCode}</span>
              <h2>Formation {setCode.slice(1)}</h2>
              <p>{setCards.length} premium launch card{setCards.length === 1 ? "" : "s"} seeded.</p>
            </Link>
          );
        })}
      </div>
      <div className="section">
        <CardFormation cards={cards} />
      </div>
    </section>
  );
}
