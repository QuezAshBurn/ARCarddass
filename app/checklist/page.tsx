import type { Metadata } from "next";
import { ChecklistClient } from "@/components/ChecklistClient";
import { getChecklistCards } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AR Carddass Collection Checklist",
  description:
    "Track owned and wanted One Piece AR Carddass King Rare, Wanted, and Film Z cards locally in your browser."
};

export default async function ChecklistPage() {
  const cards = await getCardsWithLivePrices();
  const checklistCards = getChecklistCards(cards);

  return (
    <section className="shell section">
      <span className="eyebrow">Checklist</span>
      <h1>Track owned and wanted cards.</h1>
      <p>
        Your checklist is stored locally in this browser for now. The model is
        ready for account sync later without changing the catalogue.
      </p>
      <ChecklistClient cards={checklistCards} />
    </section>
  );
}
