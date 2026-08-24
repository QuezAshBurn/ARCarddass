import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderSafeMarkdown } from "@/lib/domain/markdown";
import { getBlogPostBySlug, getBlogPosts } from "@/lib/data/blog";
import { getCardsWithLivePrices } from "@/lib/data/live-cards";
import { getMarketEvidenceForCard } from "@/lib/data/market-evidence";

type BlogArticleProps = {
  params: {
    slug: string;
  };
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BlogArticleProps): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {};
  }

  return {
    title: post.seoTitle,
    description: post.seoDescription,
    alternates: {
      canonical: `/blog/${post.slug}`
    },
    openGraph: {
      title: post.seoTitle,
      description: post.seoDescription,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      tags: post.tags
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle,
      description: post.seoDescription
    }
  };
}

function formatDate(value: string | null) {
  if (!value) return "Unpublished";
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-PH", { month: "long", day: "numeric", year: "numeric" }).format(date);
}

export default async function BlogArticlePage({ params }: BlogArticleProps) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const [cards, posts] = await Promise.all([
    getCardsWithLivePrices(),
    getBlogPosts()
  ]);
  const relatedCards = cards.filter((card) => post.relatedCardCodes.includes(card.cardNumber));
  const evidence = (
    await Promise.all(post.relatedCardCodes.slice(0, 3).map((cardCode) => getMarketEvidenceForCard(cardCode)))
  ).flatMap((item) => item.evidence);
  const relatedArticles = posts
    .filter((candidate) => candidate.slug !== post.slug)
    .filter((candidate) =>
      candidate.relatedCardCodes.some((code) => post.relatedCardCodes.includes(code)) ||
      candidate.relatedSetCodes.some((code) => post.relatedSetCodes.includes(code))
    )
    .slice(0, 3);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Organization",
      name: post.author
    }
  };

  return (
    <article className="reading-shell section blog-article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <span className="eyebrow">{post.category}</span>
      <h1>{post.title}</h1>
      <p>{post.excerpt}</p>
      <div className="blog-meta">{formatDate(post.publishedAt)} · {post.author}</div>
      <div className="content-card markdown-body" dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(post.content) }} />

      <div className="grid two">
        <div className="content-card related-posts">
          <span className="label">Related cards</span>
          <h2>Live references</h2>
          {relatedCards.length ? (
            <div className="related-post-list">
              {relatedCards.map((card) => (
                <Link href={`/cards/${card.cardNumber}`} key={card.cardNumber}>
                  <strong>{card.characterName}</strong>
                  <span>{card.cardNumber} · {card.rarity}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p>No related card codes were attached.</p>
          )}
        </div>
        <div className="content-card related-posts">
          <span className="label">Related evidence</span>
          <h2>Market trail</h2>
          {evidence.length ? (
            <div className="related-post-list">
              {evidence.slice(0, 4).map((item) => (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer" key={item.id}>
                  <strong>{item.marketplace}</strong>
                  <span>{item.eventType.replaceAll("_", " ")} · {item.validationStatus}</span>
                </a>
              ))}
            </div>
          ) : (
            <p>No public evidence is linked yet.</p>
          )}
        </div>
      </div>

      {relatedArticles.length > 0 && (
        <div className="content-card related-posts">
          <span className="label">Related articles</span>
          <div className="related-post-list">
            {relatedArticles.map((article) => (
              <Link href={`/blog/${article.slug}`} key={article.id}>
                <strong>{article.title}</strong>
                <span>{article.category}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
