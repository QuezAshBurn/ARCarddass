import type { Metadata } from "next";
import Link from "next/link";
import { blogCategories, getBlogPosts } from "@/lib/data/blog";

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

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const posts = await getBlogPosts({ category: searchParams?.category });
  const featured = posts[0];
  const newest = posts.slice(1);

  return (
    <section className="shell section">
      <span className="eyebrow">Knowledge hub</span>
      <h1>Blog, discoveries, and collector guides.</h1>
      <p>
        Articles explain the live card database, evidence ledger, and pricing engine.
        Market prices stay in Supabase market state, not inside article copy.
      </p>

      <div className="filters" aria-label="Blog categories">
        <Link className={`filter-chip ${!searchParams?.category ? "active" : ""}`} href="/blog">
          All published
        </Link>
        {blogCategories.map((category) => (
          <Link
            className={`filter-chip ${searchParams?.category === category ? "active" : ""}`}
            href={`/blog?category=${encodeURIComponent(category)}`}
            key={category}
          >
            {category}
          </Link>
        ))}
      </div>

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
