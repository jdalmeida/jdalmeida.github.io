import { neon } from "@neondatabase/serverless";
import { marked } from "marked";

export type Article = { slug: string; title: string; excerpt: string; tags: string[]; date: string; html: string };

// Same Postgres as the blog (jdalmeida.github.io); markdown is rendered here so the client ships no parser.
// ponytail: content is trusted (only the admin writes posts), so no HTML sanitizer.
export async function getArticles(): Promise<Article[]> {
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`select slug, title, excerpt, content, tags, published_at from posts where published order by published_at desc`;
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    tags: row.tags,
    date: new Date(row.published_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
    html: marked.parse(row.content, { async: false }),
  }));
}
