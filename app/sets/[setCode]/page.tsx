import { notFound } from "next/navigation";
import { SetGuide } from "@/components/SetGuide";
import { getRelatedBlogPostsForSet } from "@/lib/data/blog";
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
  const [cards, relatedPosts] = await Promise.all([
    getCardsWithLivePrices(),
    getRelatedBlogPostsForSet(params.setCode.toUpperCase())
  ]);
  const setCode = params.setCode.toUpperCase();

  if (!setCodes.includes(setCode as (typeof setCodes)[number])) {
    notFound();
  }

  const setCards = cards.filter((card) => getSetCode(card.cardNumber) === setCode);
  const productLine = setCode.startsWith("W") ? "Wanted" : "Formation";
  const setLabel = getProductLineSetLabel(productLine, setCode);

  return <SetGuide setCode={setCode} setName={setLabel} cards={setCards} relatedPosts={relatedPosts} />;
}
