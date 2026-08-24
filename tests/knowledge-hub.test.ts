import { describe, expect, it } from "vitest";
import {
  getRelatedBlogPostsForCard,
  getRelatedBlogPostsForSet,
  seededBlogPosts
} from "@/lib/data/blog";
import { calculateChecklistCompletion, normalizeChecklistState } from "@/lib/domain/checklist";
import { renderSafeMarkdown } from "@/lib/domain/markdown";

describe("knowledge hub blog data", () => {
  it("keeps draft posts out of the public seeded set by default", () => {
    const publicPosts = seededBlogPosts.filter((post) => post.status === "PUBLISHED");

    expect(publicPosts.every((post) => post.publishedAt)).toBe(true);
    expect(seededBlogPosts.some((post) => post.status === "DRAFT")).toBe(true);
  });

  it("links spotlight drafts to real card and set codes", async () => {
    const zoroPosts = await getRelatedBlogPostsForCard("F03-03");
    const formationThreePosts = await getRelatedBlogPostsForSet("F03");

    expect(zoroPosts.every((post) => post.status === "PUBLISHED")).toBe(true);
    expect(formationThreePosts.some((post) => post.slug === "how-ar-carddass-market-prices-are-calculated")).toBe(true);
  });
});

describe("markdown rendering", () => {
  it("escapes scripts while preserving basic markdown", () => {
    const html = renderSafeMarkdown("## Price rule\n\n<script>alert(1)</script>\n\n- **Verified sale**");

    expect(html).toContain("<h2>Price rule</h2>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("<strong>Verified sale</strong>");
    expect(html).not.toContain("<script>");
  });
});

describe("checklist local state", () => {
  it("normalizes unknown local storage data and calculates completion", () => {
    const state = normalizeChecklistState({
      "F01-01": { owned: true, wanted: false },
      "F03-03": { owned: false, wanted: true },
      bad: null
    });

    expect(calculateChecklistCompletion(["F01-01", "F03-03"], state)).toEqual({
      total: 2,
      owned: 1,
      wanted: 1,
      percent: 50
    });
  });
});
