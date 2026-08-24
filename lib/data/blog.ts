import { getPublicSupabaseClient, getServiceSupabaseClient } from "@/lib/database/supabase";

export type BlogPostStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";

export type BlogCategory =
  | "Market Analysis"
  | "Weekly Market Recap"
  | "Card Spotlight"
  | "Set Guide"
  | "Collector Guide"
  | "Discovery"
  | "Auction Watch"
  | "Version Guide"
  | "Grading Guide"
  | "History";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: BlogPostStatus;
  category: BlogCategory;
  author: string;
  heroImage: string | null;
  publishedAt: string | null;
  updatedAt: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  relatedCardCodes: string[];
  relatedSetCodes: string[];
  relatedEvidenceIds: string[];
  createdAt: string;
};

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_markdown: string;
  status: BlogPostStatus;
  category: BlogCategory;
  author: string | null;
  hero_image: string | null;
  published_at: string | null;
  updated_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[] | null;
  related_card_codes: string[] | null;
  related_set_codes: string[] | null;
  related_evidence_ids: string[] | null;
  created_at: string | null;
};

const now = "2026-08-24T00:00:00.000Z";

export const blogCategories: BlogCategory[] = [
  "Market Analysis",
  "Weekly Market Recap",
  "Card Spotlight",
  "Set Guide",
  "Collector Guide",
  "Discovery",
  "Auction Watch",
  "Version Guide",
  "Grading Guide",
  "History"
];

export const initialBlogDrafts: BlogPost[] = [
  {
    id: "seed-collector-pricing",
    slug: "how-ar-carddass-market-prices-are-calculated",
    title: "How AR Carddass Market Prices Are Calculated",
    excerpt:
      "A plain-language guide to the evidence order: recent verified sales first, active asks second, and graded-to-raw only when raw evidence is missing.",
    content:
      "## Pricing source of truth\n\nCurrent prices come from the market state and card version records, not from blog text.\n\n## Evidence priority\n\n1. Highest verified sold reference from the recent market window.\n2. If no sale exists, the highest active asking reference.\n3. If no raw reference exists, a graded card may be converted into a raw equivalent using the configured grading matrix.\n\n## Guardrails\n\nActive listings are not completed sales. Review-required events can be shown as evidence, but they do not automatically move the public market index.",
    status: "PUBLISHED",
    category: "Collector Guide",
    author: "AR Carddass Research Desk",
    heroImage: null,
    publishedAt: now,
    updatedAt: now,
    seoTitle: "How One Piece AR Carddass Market Prices Are Calculated",
    seoDescription:
      "Learn how AR Carddass prices use verified sales, asking references, graded-to-raw conversion, and evidence guardrails.",
    tags: ["pricing", "market-state", "evidence"],
    relatedCardCodes: [],
    relatedSetCodes: ["F01", "F02", "F03", "F04"],
    relatedEvidenceIds: [],
    createdAt: now
  },
  {
    id: "seed-what-is-formation",
    slug: "what-is-one-piece-ar-carddass-formation",
    title: "What Is One Piece AR Carddass Formation?",
    excerpt:
      "A collector introduction to AR Carddass Formation identification, rarity, version research, and market evidence.",
    content:
      "## Draft status\n\nThis introduction is staged for review. It should only publish once the catalogue facts are checked against the live card database and evidence ledger.",
    status: "DRAFT",
    category: "Collector Guide",
    author: "AR Carddass Research Desk",
    heroImage: null,
    publishedAt: null,
    updatedAt: now,
    seoTitle: "What Is One Piece AR Carddass Formation?",
    seoDescription: "Collector guide draft for One Piece AR Carddass Formation.",
    tags: ["formation", "collector-guide"],
    relatedCardCodes: [],
    relatedSetCodes: ["F01", "F02", "F03", "F04"],
    relatedEvidenceIds: [],
    createdAt: now
  },
  ...["F01", "F02", "F03", "F04"].map((setCode) => ({
    id: `seed-guide-${setCode.toLowerCase()}`,
    slug: `ar-carddass-formation-${setCode.slice(1)}-guide`,
    title: `AR Carddass Formation ${setCode.slice(1)} Guide`,
    excerpt: `Checklist, rarity notes, and market highlights for Formation ${setCode.slice(1)}.`,
    content:
      "## Draft status\n\nThis set guide is generated from the live catalogue, but release notes and variant notes still need collector review before publication.",
    status: "DRAFT" as const,
    category: "Set Guide" as const,
    author: "AR Carddass Research Desk",
    heroImage: null,
    publishedAt: null,
    updatedAt: now,
    seoTitle: `One Piece AR Carddass Formation ${setCode.slice(1)} Checklist and Card Guide`,
    seoDescription: `Draft set guide for One Piece AR Carddass Formation ${setCode.slice(1)}.`,
    tags: ["set-guide", setCode.toLowerCase()],
    relatedCardCodes: [],
    relatedSetCodes: [setCode],
    relatedEvidenceIds: [],
    createdAt: now
  })),
  {
    id: "seed-kr-skr",
    slug: "kr-vs-skr-understanding-ar-carddass-rarities",
    title: "KR vs SKR: Understanding AR Carddass Rarities",
    excerpt: "A review draft for rarity labels used by the Formation catalogue.",
    content:
      "## Draft status\n\nThis rarity guide is staged until the full rarity ladder is validated against the catalogue.",
    status: "DRAFT",
    category: "Collector Guide",
    author: "AR Carddass Research Desk",
    heroImage: null,
    publishedAt: null,
    updatedAt: now,
    seoTitle: "KR vs SKR: Understanding AR Carddass Rarities",
    seoDescription: "Draft rarity guide for One Piece AR Carddass Formation.",
    tags: ["rarity", "kr", "skr"],
    relatedCardCodes: [],
    relatedSetCodes: ["F01", "F02", "F03", "F04"],
    relatedEvidenceIds: [],
    createdAt: now
  }
];

const spotlightCards = [
  ["F01-01", "Luffy"],
  ["F01-37", "Ace"],
  ["F02-20", "Boa Hancock"],
  ["F02-24", "Crocodile"],
  ["F03-03", "Zoro"],
  ["F03-13", "Sanji"],
  ["F04-13", "Rob Lucci"],
  ["F04-27", "Sogeking"]
] as const;

export const firstCardSpotlightDrafts: BlogPost[] = spotlightCards.map(([cardCode, name]) => ({
  id: `seed-spotlight-${cardCode.toLowerCase()}`,
  slug: `card-spotlight-${cardCode.toLowerCase()}-${name.toLowerCase().replaceAll(" ", "-")}`,
  title: `Card Spotlight: ${name} ${cardCode}`,
  excerpt: `Draft spotlight for ${name}, linked to ${cardCode} and awaiting evidence review.`,
  content:
    "## Draft status\n\nThis spotlight should pull live identity, pricing, and evidence from the card page. Add narrative only after the evidence timeline is reviewed.",
  status: "DRAFT",
  category: "Card Spotlight",
  author: "AR Carddass Research Desk",
  heroImage: null,
  publishedAt: null,
  updatedAt: now,
  seoTitle: `${cardCode} ${name} - One Piece AR Carddass Formation Spotlight`,
  seoDescription: `Draft spotlight for ${cardCode} ${name}.`,
  tags: ["card-spotlight", cardCode.toLowerCase()],
  relatedCardCodes: [cardCode],
  relatedSetCodes: [cardCode.slice(0, 3)],
  relatedEvidenceIds: [],
  createdAt: now
}));

export const seededBlogPosts = [...initialBlogDrafts, ...firstCardSpotlightDrafts];

function rowToBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    content: row.content_markdown,
    status: row.status,
    category: row.category,
    author: row.author ?? "AR Carddass Research Desk",
    heroImage: row.hero_image,
    publishedAt: row.published_at,
    updatedAt: row.updated_at ?? row.created_at ?? now,
    seoTitle: row.seo_title ?? row.title,
    seoDescription: row.seo_description ?? row.excerpt ?? "",
    tags: row.tags ?? [],
    relatedCardCodes: row.related_card_codes ?? [],
    relatedSetCodes: row.related_set_codes ?? [],
    relatedEvidenceIds: row.related_evidence_ids ?? [],
    createdAt: row.created_at ?? now
  };
}

type BlogQuery = {
  category?: string;
  includeDrafts?: boolean;
};

export async function getBlogPosts(query: BlogQuery = {}): Promise<BlogPost[]> {
  const supabase = query.includeDrafts ? getServiceSupabaseClient() : getPublicSupabaseClient();

  if (!supabase) {
    return seededBlogPosts
      .filter((post) => query.includeDrafts || post.status === "PUBLISHED")
      .filter((post) => !query.category || post.category === query.category)
      .sort((a, b) => (b.publishedAt ?? b.updatedAt).localeCompare(a.publishedAt ?? a.updatedAt));
  }

  let request = supabase
    .from("blog_posts")
    .select(
      "id,slug,title,excerpt,content_markdown,status,category,author,hero_image,published_at,updated_at,seo_title,seo_description,tags,related_card_codes,related_set_codes,related_evidence_ids,created_at"
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (!query.includeDrafts) {
    request = request.eq("status", "PUBLISHED");
  }

  if (query.category) {
    request = request.eq("category", query.category);
  }

  const { data, error } = await request;

  if (error || !data) {
    console.warn("Falling back to seeded blog posts:", error?.message);
    return seededBlogPosts
      .filter((post) => query.includeDrafts || post.status === "PUBLISHED")
      .filter((post) => !query.category || post.category === query.category);
  }

  return (data as BlogPostRow[]).map(rowToBlogPost);
}

export async function getBlogPostBySlug(slug: string, includeDrafts = false) {
  const posts = await getBlogPosts({ includeDrafts });

  return posts.find((post) => post.slug === slug);
}

export async function getRelatedBlogPostsForCard(cardCode: string, limit = 4) {
  const posts = await getBlogPosts();

  return posts
    .filter((post) => post.relatedCardCodes.some((code) => code.toLowerCase() === cardCode.toLowerCase()))
    .slice(0, limit);
}

export async function getRelatedBlogPostsForSet(setCode: string, limit = 4) {
  const posts = await getBlogPosts();

  return posts
    .filter((post) => post.relatedSetCodes.some((code) => code.toLowerCase() === setCode.toLowerCase()))
    .slice(0, limit);
}
