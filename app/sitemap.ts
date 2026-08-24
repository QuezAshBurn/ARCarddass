import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/data/blog";
import { cards } from "@/lib/data/cards";

const baseUrl = "https://arcarddass.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();
  const staticRoutes = [
    "",
    "/cards",
    "/cards/formation-01",
    "/cards/formation-02",
    "/cards/formation-03",
    "/cards/formation-04",
    "/market",
    "/blog",
    "/checklist",
    "/evidence",
    "/about",
    "/search"
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date()
    })),
    ...cards.map((card) => ({
      url: `${baseUrl}/cards/${card.cardNumber}`,
      lastModified: new Date()
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt)
    }))
  ];
}
