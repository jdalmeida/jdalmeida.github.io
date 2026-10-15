"use client";

import { marked } from "marked";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { savePost } from "@/app/admin/artigos/actions";
import { slugify } from "@/lib/links";
import styles from "./post-editor.module.css";

export type PostDraft = { id?: number; title: string; slug: string; excerpt: string; content: string; tags: string[]; published: boolean; published_at: string | null };

const input = "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500";
// datetime-local wants local "YYYY-MM-DDTHH:mm".
const local = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : "");

// Markdown on the left, the rendered post on the right (same parser the site uses).
export default function PostEditor({ post }: { post: PostDraft }) {
  const router = useRouter();
  const [p, setP] = useState(post);
  const [slugTouched, setSlugTouched] = useState(!!post.id);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [tab, setTab] = useState<"md" | "preview">("md");
  const html = useMemo(() => marked.parse(p.content, { async: false }), [p.content]);
  const set = (patch: Partial<PostDraft>) => { setP({ ...p, ...patch }); setMsg(null); };

  return (
    <form className="space-y-4 text-sm" action={async (f) => {
      const r = await savePost(f);
      if (!r.ok) return setMsg({ ok: false, text: r.error });
      setMsg({ ok: true, text: "Salvo." });
      if (!p.id) router.replace(`/admin/artigos/${r.id}`); else router.refresh();
    }}>
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-neutral-400">Título
          <input name="title" required value={p.title} className={input}
            onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} />
        </label>
        <label className="flex flex-col gap-1 text-neutral-400">Endereço (/blog/…)
          <input name="slug" required value={p.slug} className={`${input} font-mono`} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }} />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-neutral-400">Resumo (aparece na abertura do artigo e na prévia de link)
        <textarea name="excerpt" rows={2} value={p.excerpt} onChange={(e) => set({ excerpt: e.target.value })} className={input} />
      </label>
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
        <label className="flex flex-col gap-1 text-neutral-400">Tags (separadas por vírgula)
          <input name="tags" value={p.tags.join(", ")} onChange={(e) => set({ tags: e.target.value.split(",").map((t) => t.trimStart()) })} className={input} />
        </label>
        <label className="flex flex-col gap-1 text-neutral-400">Data de publicação
          <input name="published_at" type="datetime-local" value={local(p.published_at)} onChange={(e) => set({ published_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className={input} />
        </label>
        <label className="flex items-center gap-2 py-2 text-neutral-200">
          <input type="checkbox" name="published" checked={p.published} onChange={(e) => set({ published: e.target.checked })} className="accent-sky-500" /> Publicado
        </label>
      </div>

      <div className="flex gap-1 lg:hidden">
        {(["md", "preview"] as const).map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={`rounded-md px-3 py-1 ${tab === t ? "bg-neutral-800 text-neutral-50" : "text-neutral-400"}`}>{t === "md" ? "Markdown" : "Prévia"}</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <textarea name="content" value={p.content} onChange={(e) => set({ content: e.target.value })} spellCheck
          className={`${input} min-h-[60vh] font-mono text-[13px] leading-relaxed ${tab === "md" ? "" : "hidden lg:block"}`} />
        <div className={`${styles.preview} min-h-[60vh] overflow-auto rounded-lg border border-neutral-800 bg-[#f7f3e9] p-6 text-neutral-900 ${tab === "preview" ? "" : "hidden lg:block"}`}
          dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-neutral-800 bg-neutral-950/90 py-3 backdrop-blur">
        <button className="rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500">{p.id ? "Salvar" : "Criar artigo"}</button>
        {msg && <span role="status" className={msg.ok ? "text-emerald-400" : "text-red-400"}>{msg.text}</span>}
        {p.id && p.published && <a href={`/blog/${post.slug}`} target="_blank" className="ml-auto text-sky-400 hover:underline">Ver no site ↗</a>}
      </div>
    </form>
  );
}
