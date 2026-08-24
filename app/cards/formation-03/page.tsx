import { SetGuide } from "@/components/SetGuide";
import { getRelatedBlogPostsForSet } from "@/lib/data/blog";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getCoreKingRareCards, getSetCode } from "@/lib/data/cards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "One Piece AR Carddass Formation 03 Checklist and Card Guide",
  description: "Formation 03 checklist, rarity breakdown, premium cards, market highlights, and related guides."
};

export default async function Formation03Page() {
  const [cards, posts] = await Promise.all([getCardsWithLivePrices(), getRelatedBlogPostsForSet("F03")]);
  return <SetGuide setCode="F03" setName="One Piece AR Carddass Formation 03" cards={getCoreKingRareCards(cards).filter((card) => getSetCode(card.cardNumber) === "F03")} relatedPosts={posts} />;
}
