import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/data/blog";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getSetCode } from "@/lib/data/cards";

type SearchPageProps = {
  searchParams?: {
    q?: string;
  };
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search AR Carddass",
  description: "Search AR Carddass cards, sets, rarities, and published articles."
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const normalized = query.toLowerCase();
  const [cards, posts] = await Promise.all([getCardsWithLivePrices(), getBlogPosts()]);
  const cardResults = normalized
    ? cards.filter((card) =>
        [card.cardNumber, card.characterName, card.rarity, card.formationSet, card.productLine, card.catalogueGroup ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalized)
      )
    : [];
  const articleResults = normalized
    ? posts.filter((post) => [post.title, post.excerpt, post.category, post.tags.join(" ")].join(" ").toLowerCase().includes(normalized))
    : [];
  const setCodes = Array.from(new Set(cards.map((card) => getSetCode(card.cardNumber)))).sort();
  const setResults = normalized
    ? setCodes.filter((setCode) => setCode.toLowerCase().includes(normalized) || `formation ${setCode.slice(1)}`.includes(normalized))
    : [];

  return (
    <section className="shell section">
      <span className="eyebrow">Global search</span>
      <h1>Find cards, articles, and sets.</h1>
      <form className="content-card search-form" action="/search">
        <input name="q" defaultValue={query} placeholder="Search card code, character, rarity, set, or article" />
        <button className="button primary" type="submit">Search</button>
      </form>

      <div className="grid three search-results">
        <div className="content-card related-posts">
          <span className="label">Cards</span>
          <h2>{cardResults.length} results</h2>
          <div className="related-post-list">
            {cardResults.slice(0, 12).map((card) => (
              <Link href={`/cards/${card.cardNumber}`} key={card.cardNumber}>
                <strong>{card.characterName}</strong>
                <span>{card.cardNumber} · {card.rarity}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="content-card related-posts">
          <span className="label">Articles</span>
          <h2>{articleResults.length} results</h2>
          <div className="related-post-list">
            {articleResults.slice(0, 12).map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id}>
                <strong>{post.title}</strong>
                <span>{post.category}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="content-card related-posts">
          <span className="label">Sets</span>
          <h2>{setResults.length} results</h2>
          <div className="related-post-list">
            {setResults.map((setCode) => (
              <Link href={`/sets/${setCode}`} key={setCode}>
                <strong>{setCode}</strong>
                <span>Formation set</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
