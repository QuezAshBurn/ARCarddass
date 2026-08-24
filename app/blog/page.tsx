import type { Metadata } from "next";
import Link from "next/link";
import { getBlogPosts } from "@/lib/data/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AR Carddass Pricing Newsletter",
  description:
    "Focused AR Carddass pricing newsletters generated from market evidence, card movement, and pricing signals."
};

function formatDate(value: string | null) {
  if (!value) return "Draft review";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export default async function BlogPage() {
  const pricingNewsletters = await getBlogPosts({ category: "Weekly Market Recap" });
  const featured = pricingNewsletters[0];
  const previousNewsletters = pricingNewsletters.slice(1);

  return (
    <section className="shell section">
      <span className="eyebrow">Pricing newsletter</span>
      <h1>AR Carddass Pricing Newsletter.</h1>
      <p>
        A focused feed for market movement, evidence notes, and pricing recaps.
        ChatGPT prepares the newsletter from the pricing ledger, and published
        issues appear here after review.
      </p>

      {featured ? (
        <Link className="content-card blog-newsletter-card" href={`/blog/${featured.slug}`}>
          <span className="label">Latest pricing newsletter</span>
          <h2>{featured.title}</h2>
          <p>{featured.excerpt}</p>
          <div className="blog-newsletter-meta">
            <small>{formatDate(featured.publishedAt)} · {featured.author}</small>
            {featured.relatedCardCodes.length > 0 && (
              <span>{featured.relatedCardCodes.slice(0, 8).join(" · ")}</span>
            )}
          </div>
        </Link>
      ) : (
        <div className="content-card coming-soon-panel">
          <span className="label">No published pricing newsletters yet</span>
          <h2>Pricing newsletters are intentionally held for review.</h2>
          <p>
            The newsletter generator can draft market recaps into Supabase, but
            the public page only shows issues after their status is changed to
            PUBLISHED.
          </p>
        </div>
      )}

      {previousNewsletters.length > 0 && (
        <>
          <div className="section-head compact-section-head">
            <div>
              <span className="label">Archive</span>
              <h2>Previous pricing newsletters</h2>
            </div>
          </div>
          <div className="grid three blog-grid">
            {previousNewsletters.map((post) => (
              <Link className="content-card blog-card" href={`/blog/${post.slug}`} key={post.id}>
                <span className="label">Pricing Newsletter</span>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <small>{formatDate(post.publishedAt)}</small>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
