import Link from "next/link";
import { getBlogPosts } from "@/lib/data/blog";

type AdminBlogPageProps = {
  searchParams?: {
    token?: string;
  };
};

export const dynamic = "force-dynamic";

function canAccess(token?: string) {
  return Boolean(process.env.TRAFFIC_REPORT_TOKEN && token && token === process.env.TRAFFIC_REPORT_TOKEN);
}

export default async function AdminBlogPage({ searchParams }: AdminBlogPageProps) {
  if (!canAccess(searchParams?.token)) {
    return (
      <section className="shell section">
        <div className="content-card traffic-access-card">
          <span className="label">Protected blog admin</span>
          <h1>Draft tools require the private admin token.</h1>
          <p>Use the same token pattern as the private traffic report.</p>
        </div>
      </section>
    );
  }

  const posts = await getBlogPosts({ includeDrafts: true });

  return (
    <section className="shell section">
      <span className="eyebrow">Blog admin</span>
      <h1>Drafts, review, and publishing queue.</h1>
      <p>
        Public readers only see PUBLISHED posts. Draft creation and publication should
        happen through Supabase or the draft scripts until account-based admin editing is added.
      </p>

      <div className="grid three">
        <div className="stat-card">
          <span>Total posts</span>
          <strong>{posts.length}</strong>
        </div>
        <div className="stat-card">
          <span>Drafts</span>
          <strong>{posts.filter((post) => post.status === "DRAFT").length}</strong>
        </div>
        <div className="stat-card">
          <span>Published</span>
          <strong>{posts.filter((post) => post.status === "PUBLISHED").length}</strong>
        </div>
      </div>

      <div className="table-wrap admin-blog-table-wrap">
        <table className="admin-blog-table">
          <thead>
            <tr>
              <th>Post</th>
              <th>Category</th>
              <th>Status</th>
              <th>Related cards</th>
              <th>Preview</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td data-label="Post">
                  <strong>{post.title}</strong>
                  <span>{post.slug}</span>
                </td>
                <td data-label="Category">{post.category}</td>
                <td data-label="Status">
                  <span className={post.status === "PUBLISHED" ? "pill live" : "pill review"}>{post.status}</span>
                </td>
                <td data-label="Related cards">{post.relatedCardCodes.join(", ") || "None"}</td>
                <td data-label="Preview">
                  {post.status === "PUBLISHED" ? (
                    <Link className="traffic-hidden-link" href={`/blog/${post.slug}`}>Open</Link>
                  ) : (
                    <span className="muted">Draft hidden</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
