import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { neon } from "@neondatabase/serverless";
import PostEditor, { type PostDraft } from "@/components/admin/post-editor";
import { requireAdmin } from "@/lib/admin";
import { deletePost } from "../actions";

export const metadata: Metadata = { title: "Editar artigo · Admin", robots: { index: false, follow: false } };

// /admin/artigos/novo starts an empty post.
export default async function EditPost({ params }: PageProps<"/admin/artigos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  let post: PostDraft = { title: "", slug: "", excerpt: "", content: "", tags: [], published: false, published_at: null };
  if (id !== "novo") {
    if (!/^\d+$/.test(id)) notFound();
    const [row] = await neon(process.env.DATABASE_URL!)`select id, title, slug, excerpt, content, tags, published, published_at from posts where id = ${Number(id)}`;
    if (!row) notFound();
    post = { ...(row as PostDraft), published_at: row.published_at ? new Date(row.published_at).toISOString() : null };
  }
  return (
    <main className="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center gap-3">
        <Link href="/admin/artigos" className="text-sm text-sky-400 hover:underline">← Artigos</Link>
        <h1 className="mr-auto text-xl font-semibold text-neutral-50">{post.id ? post.title : "Novo artigo"}</h1>
        {post.id && (
          <details className="relative text-sm">
            <summary className="cursor-pointer list-none rounded-lg border border-neutral-700 px-3 py-1.5 text-neutral-400 hover:border-red-500 hover:text-red-400">Excluir</summary>
            <form action={deletePost} className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-neutral-700 bg-neutral-900 p-3 shadow-lg">
              <input type="hidden" name="id" value={post.id} />
              <p className="mb-2 text-neutral-300">Apagar este artigo de vez? Para só tirar do ar, desmarque “Publicado”.</p>
              <button className="w-full rounded bg-red-600 px-2 py-1 font-medium text-white hover:bg-red-500">Sim, excluir</button>
            </form>
          </details>
        )}
      </header>
      <p className="text-xs text-neutral-500">
        Publicar ou tirar um artigo do ar muda a numeração das páginas do caderno: selos colados nas páginas de artigos andam junto.
      </p>
      <PostEditor key={post.id ?? "novo"} post={post} />
    </main>
  );
}
