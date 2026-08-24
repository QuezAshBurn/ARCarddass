import type { Metadata } from "next";
import { ChecklistClient } from "@/components/ChecklistClient";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AR Carddass Formation Checklist",
  description:
    "Track owned and wanted One Piece AR Carddass Formation cards locally in your browser."
};

export default async function ChecklistPage() {
  const cards = await getCardsWithLivePrices();
  const formationCards = cards.filter((card) => card.productLine === "Formation");

  return (
    <section className="shell section">
      <span className="eyebrow">Checklist</span>
      <h1>Track owned and wanted cards.</h1>
      <p>
        Your checklist is stored locally in this browser for now. The model is
        ready for account sync later without changing the catalogue.
      </p>
      <ChecklistClient cards={formationCards} />
    </section>
  );
}
