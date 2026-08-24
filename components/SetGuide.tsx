import Link from "next/link";
import { CardGrid } from "@/components/CardGrid";
import type { BlogPost } from "@/lib/data/blog";
import type { Card } from "@/lib/data/cards";
import { formatPeso, getPrimaryVersion } from "@/lib/data/cards";

type SetGuideProps = {
  setCode: string;
  setName: string;
  cards: Card[];
  relatedPosts: BlogPost[];
};

export function SetGuide({ setCode, setName, cards, relatedPosts }: SetGuideProps) {
  const rarityBreakdown = cards.reduce<Record<string, number>>((counts, card) => {
    counts[card.rarity] = (counts[card.rarity] ?? 0) + 1;
    return counts;
  }, {});
  const premiumCards = cards.filter((card) => card.rarity === "KR" || card.rarity === "SKR");
  const highest = [...cards].sort(
    (a, b) => getPrimaryVersion(b).currentPublishedPricePhp - getPrimaryVersion(a).currentPublishedPricePhp
  )[0];

  return (
    <section className="shell section" data-set={setCode}>
      <div className="content-card set-panel" data-set={setCode}>
        <span className="label">Formation set guide</span>
        <h1>{setName}</h1>
        <p>
          This guide is calculated from the current card catalogue. Release notes, variants,
          and discoveries remain marked for review until documented by evidence.
        </p>
      </div>

      <div className="grid three set-guide-stats">
        <div className="stat-card">
          <span>Total known cards</span>
          <strong>{cards.length || "Unknown"}</strong>
        </div>
        <div className="stat-card">
          <span>Premium cards</span>
          <strong>{premiumCards.length}</strong>
        </div>
        <div className="stat-card">
          <span>Market highlight</span>
          <strong>{highest ? formatPeso(getPrimaryVersion(highest).currentPublishedPricePhp) : "Needs review"}</strong>
          <p>{highest?.characterName ?? "No card data loaded"}</p>
        </div>
      </div>

      <div className="grid two">
        <div className="content-card">
          <span className="label">Rarity breakdown</span>
          <h2>Catalogue shape</h2>
          <div className="rarity-breakdown">
            {Object.entries(rarityBreakdown).map(([rarity, count]) => (
              <span key={rarity}>{rarity}: {count}</span>
            ))}
            {!Object.keys(rarityBreakdown).length && <span>Needs Review</span>}
          </div>
        </div>
        <div className="content-card">
          <span className="label">Known variants</span>
          <h2>Version research</h2>
          <p>
            JP, EN, and HK/CN/TW version evidence may differ. This page links to
            card-level version tables instead of claiming one universal value.
          </p>
        </div>
      </div>

      <div className="section-head compact">
        <div>
          <span className="label">Checklist</span>
          <h2>{setName} cards</h2>
        </div>
        <Link className="button secondary" href="/checklist">Open full checklist</Link>
      </div>
      <CardGrid cards={cards} />

      <div className="content-card related-posts">
        <span className="label">Related reading</span>
        <h2>Set notes and guides</h2>
        {relatedPosts.length ? (
          <div className="related-post-list">
            {relatedPosts.map((post) => (
              <Link href={`/blog/${post.slug}`} key={post.id}>
                <strong>{post.title}</strong>
                <span>{post.category}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p>No published set article yet. Drafts can be reviewed from the blog admin workflow.</p>
        )}
      </div>
    </section>
  );
}
