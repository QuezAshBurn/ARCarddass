import { SetGuide } from "@/components/SetGuide";
import { getRelatedBlogPostsForSet } from "@/lib/data/blog";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getCoreKingRareCards, getSetCode } from "@/lib/data/cards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "One Piece AR Carddass Formation 02 Checklist and Card Guide",
  description: "Formation 02 checklist, rarity breakdown, premium cards, market highlights, and related guides."
};

export default async function Formation02Page() {
  const [cards, posts] = await Promise.all([getCardsWithLivePrices(), getRelatedBlogPostsForSet("F02")]);
  return <SetGuide setCode="F02" setName="One Piece AR Carddass Formation 02" cards={getCoreKingRareCards(cards).filter((card) => getSetCode(card.cardNumber) === "F02")} relatedPosts={posts} />;
}
