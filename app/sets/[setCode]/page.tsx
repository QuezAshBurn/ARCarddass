import { notFound } from "next/navigation";
import { CardGrid } from "@/components/CardGrid";
import { getSetCode } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

const setCodes = ["F01", "F02", "F03", "F04"] as const;

type SetPageProps = {
  params: {
    setCode: string;
  };
};

export function generateStaticParams() {
  return setCodes.map((setCode) => ({ setCode }));
}

export const dynamic = "force-dynamic";

export default async function SetPage({ params }: SetPageProps) {
  const cards = await getCardsWithLivePrices();
  const setCode = params.setCode.toUpperCase();

  if (!setCodes.includes(setCode as (typeof setCodes)[number])) {
    notFound();
  }

  const setCards = cards.filter((card) => getSetCode(card.cardNumber) === setCode);

  return (
    <section className="shell section" data-set={setCode}>
      <div className="content-card set-panel" data-set={setCode}>
        <span className="label">Formation set</span>
        <h1>Formation {setCode.slice(1)}</h1>
        <p>
          This route is scoped to the Formation product line. Wanted sets will use
          their own set codes and pricing evidence when they are added.
        </p>
      </div>
      <div style={{ height: 24 }} />
      <CardGrid cards={setCards} />
    </section>
  );
}
