import { notFound } from "next/navigation";
import { CardGrid } from "@/components/CardGrid";
import { cards, getSetCode } from "@/lib/data/cards";

const setCodes = ["F01", "F02", "F03", "F04"] as const;

type SetPageProps = {
  params: {
    setCode: string;
  };
};

export function generateStaticParams() {
  return setCodes.map((setCode) => ({ setCode }));
}

export default function SetPage({ params }: SetPageProps) {
  const setCode = params.setCode.toUpperCase();

  if (!setCodes.includes(setCode as (typeof setCodes)[number])) {
    notFound();
  }

  const setCards = cards.filter((card) => getSetCode(card.cardNumber) === setCode);

  return (
    <section className="shell section" data-set={setCode}>
      <div className="content-card set-panel" data-set={setCode}>
        <span className="label">Formation set</span>
        <h1>{setCode}</h1>
        <p>
          Set panel powered by original UI artwork. Card scans remain placeholders
          until user-owned scans are added.
        </p>
      </div>
      <div style={{ height: 24 }} />
      <CardGrid cards={setCards} />
    </section>
  );
}
