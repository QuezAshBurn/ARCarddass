import type { Metadata } from "next";
import Link from "next/link";
import type { BlogCategory } from "@/lib/data/blog";
import { getBlogPosts } from "@/lib/data/blog";
import { formatMarketUpdateLabel, formatPeso, getPrimaryVersion } from "@/lib/data/cards";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams?: {
    category?: string;
  };
};

export const metadata: Metadata = {
  title: "AR Carddass Blog and Collector Guides",
  description:
    "Collector guides, market analysis, discoveries, and card spotlights for One Piece AR Carddass Formation."
};

function formatDate(value: string | null) {
  if (!value) return "Draft review";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

const featuredBlogCategories: BlogCategory[] = [
  "Market Analysis",
  "Auction Watch",
  "Card Spotlight",
  "Collector Guide"
];

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const [posts, latestMarketNewsPosts, cards] = await Promise.all([
    getBlogPosts({ category: searchParams?.category }),
    getBlogPosts({ category: "Weekly Market Recap" }),
    getCardsWithLivePrices()
  ]);
  const featured = posts[0];
  const newest = posts.slice(1);
  const latestMarketNews = latestMarketNewsPosts[0];
  const recentCardUpdates = [...cards]
    .sort((a, b) => {
      const aVersion = getPrimaryVersion(a);
      const bVersion = getPrimaryVersion(b);
      const aTime = aVersion.lastMarketUpdateAt ? new Date(aVersion.lastMarketUpdateAt).getTime() : 0;
      const bTime = bVersion.lastMarketUpdateAt ? new Date(bVersion.lastMarketUpdateAt).getTime() : 0;

      if (bTime !== aTime) return bTime - aTime;

      return Math.abs(bVersion.weeklyChangePercent) - Math.abs(aVersion.weeklyChangePercent);
    })
    .slice(0, 4);

  return (
    <section className="shell section">
      <span className="eyebrow">Knowledge hub</span>
      <h1>Market news and collector guides.</h1>
      <p>
        Articles explain the live card database, evidence ledger, pricing engine,
        and card-by-card market movement. Market prices stay in Supabase market
        state, while this page surfaces the latest story-worthy signals.
      </p>

      <div className="filters" aria-label="Blog categories">
        <Link className={`filter-chip ${!searchParams?.category ? "active" : ""}`} href="/blog">
          All published
        </Link>
        {featuredBlogCategories.map((category) => (
          <Link
            className={`filter-chip ${searchParams?.category === category ? "active" : ""}`}
            href={`/blog?category=${encodeURIComponent(category)}`}
            key={category}
          >
            {category}
          </Link>
        ))}
      </div>

      {latestMarketNews && (
        <Link className="content-card blog-newsletter-card" href={`/blog/${latestMarketNews.slug}`}>
          <span className="label">Latest market news</span>
          <h2>{latestMarketNews.title}</h2>
          <p>{latestMarketNews.excerpt}</p>
          <div className="blog-newsletter-meta">
            <small>{formatDate(latestMarketNews.publishedAt)} · {latestMarketNews.author}</small>
            {latestMarketNews.relatedCardCodes.length > 0 && (
              <span>{latestMarketNews.relatedCardCodes.slice(0, 6).join(" · ")}</span>
            )}
          </div>
        </Link>
      )}

      {featured ? (
        <Link className="content-card blog-featured" href={`/blog/${featured.slug}`}>
          <span className="label">{featured.category}</span>
          <h2>{featured.title}</h2>
          <p>{featured.excerpt}</p>
          <small>{formatDate(featured.publishedAt)} · {featured.author}</small>
        </Link>
      ) : (
        <div className="content-card coming-soon-panel">
          <span className="label">No published posts yet</span>
          <h2>Drafts are intentionally held for review.</h2>
          <p>
            The blog model is ready, but public posts only appear after their status is
            changed to PUBLISHED in Supabase.
          </p>
        </div>
      )}

      <div className="section-head compact-section-head">
        <div>
          <span className="label">Live card desk</span>
          <h2>Latest card signals</h2>
        </div>
      </div>
      <div className="grid four knowledge-grid">
        {recentCardUpdates.map((card) => {
          const primary = getPrimaryVersion(card);

          return (
            <Link className="content-card blog-card" href={`/cards/${card.cardNumber}`} key={card.cardNumber}>
              <span className="label">{card.catalogueGroup ?? card.productLine} · {card.rarity}</span>
              <h2>{card.characterName}</h2>
              <p>
                {formatPeso(primary.currentPublishedPricePhp)} market index ·{" "}
                {primary.weeklyChangePercent >= 0 ? "+" : ""}
                {primary.weeklyChangePercent.toFixed(2)}% this update.
              </p>
              <small>{formatMarketUpdateLabel(primary.lastMarketUpdateAt)}</small>
            </Link>
          );
        })}
      </div>

      <div className="grid three blog-grid">
        {newest.map((post) => (
          <Link className="content-card blog-card" href={`/blog/${post.slug}`} key={post.id}>
            <span className="label">{post.category}</span>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <small>{formatDate(post.publishedAt)}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
