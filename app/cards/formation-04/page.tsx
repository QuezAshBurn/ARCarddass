import { SetGuide } from "@/components/SetGuide";
import { getRelatedBlogPostsForSet } from "@/lib/data/blog";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getSetCode } from "@/lib/data/cards";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "One Piece AR Carddass Formation 04 Checklist and Card Guide",
  description: "Formation 04 checklist, rarity breakdown, premium cards, Film Z group, market highlights, and related guides."
};

export default async function Formation04Page() {
  const [cards, posts] = await Promise.all([getCardsWithLivePrices(), getRelatedBlogPostsForSet("F04")]);
  return <SetGuide setCode="F04" setName="One Piece AR Carddass Formation 04" cards={cards.filter((card) => getSetCode(card.cardNumber) === "F04")} relatedPosts={posts} />;
}
