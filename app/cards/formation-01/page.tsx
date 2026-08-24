import { SetGuide } from "@/components/SetGuide";
import { getRelatedBlogPostsForSet } from "@/lib/data/blog";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getSetCode } from "@/lib/data/cards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "One Piece AR Carddass Formation 01 Checklist and Card Guide",
  description: "Formation 01 checklist, rarity breakdown, premium cards, market highlights, and related guides."
};

export default async function Formation01Page() {
  const [cards, posts] = await Promise.all([getCardsWithLivePrices(), getRelatedBlogPostsForSet("F01")]);
  return <SetGuide setCode="F01" setName="One Piece AR Carddass Formation 01" cards={cards.filter((card) => getSetCode(card.cardNumber) === "F01")} relatedPosts={posts} />;
}
