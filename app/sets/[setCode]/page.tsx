import { notFound } from "next/navigation";
import { CardGrid } from "@/components/CardGrid";
import { getProductLineSetLabel, getSetCode } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

const setCodes = ["F01", "F02", "F03", "F04", "W01", "W02", "W03", "W04"] as const;

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
  const productLine = setCode.startsWith("W") ? "Wanted" : "Formation";
  const productLineLabel = productLine === "Wanted" ? "Wanted" : "King Rare";
  const setLabel = getProductLineSetLabel(productLine, setCode);

  return (
    <section className="shell section" data-set={setCode}>
      <div className="content-card set-panel" data-set={setCode}>
        <span className="label">{productLineLabel} set</span>
        <h1>{setLabel}</h1>
        <p>
          This route is scoped to the {productLineLabel} product line, with its
          own set codes, pricing evidence, demand, scarcity, and market movement.
        </p>
      </div>
      <div style={{ height: 24 }} />
      <CardGrid cards={setCards} />
    </section>
  );
}
