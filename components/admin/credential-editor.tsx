"use client";

import { useState } from "react";
import { saveCredential } from "@/app/admin/credenciais/actions";
import CredentialBadge from "@/components/ui/credential-badge";
import { MAX_PHOTOS, type Credential } from "@/lib/credential-meta";

const input = "rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500";

export type CredentialDraft = Omit<Credential, "id"> & { id?: string; position: number; published: boolean };
type Upload = { blob: Blob; preview: string };

// Photos go up as 960px WebP (the polaroids show them at most ~480px), so a phone picture fits in the action's body limit.
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 960 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const encode = (type: string) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, 0.82));
  // Safari can't encode WebP and hands back a PNG instead: use JPEG there.
  const webp = await encode("image/webp");
  return webp?.type === "image/webp" ? webp : (await encode("image/jpeg"))!;
}

// Creates or edits an event credential with a live preview of its badge; the photos become the board's polaroids.
export default function CredentialEditor({ initial }: { initial: CredentialDraft }) {
  const [d, setD] = useState(initial);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<CredentialDraft>) => setD({ ...d, ...patch });
  const room = MAX_PHOTOS - d.images.length - uploads.length;

  const pick = async (files: FileList | null) => {
    setError("");
    try {
      const picked = await Promise.all([...(files ?? [])].slice(0, room).map(shrink));
      setUploads([...uploads, ...picked.map((blob) => ({ blob, preview: URL.createObjectURL(blob) }))]);
    } catch {
      setError("Não consegui ler essa imagem. Tente um JPG, PNG ou WebP.");
    }
  };

  const submit = async (form: FormData) => {
    setBusy(true);
    setError("");
    form.set("images", JSON.stringify(d.images));
    uploads.forEach((u, i) => form.append("photo", u.blob, `foto-${i + 1}.${u.blob.type.split("/")[1]}`));
    try {
      await saveCredential(form);
      uploads.forEach((u) => URL.revokeObjectURL(u.preview));
      setUploads([]);
      if (!d.id) setD(initial);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  };

  const photos = [
    ...d.images.map((src) => ({ src, remove: () => set({ images: d.images.filter((x) => x !== src) }) })),
    ...uploads.map((u) => ({ src: u.preview, remove: () => { URL.revokeObjectURL(u.preview); setUploads(uploads.filter((x) => x !== u)); } })),
  ];

  return (
    <form action={submit} className="grid gap-6 text-sm lg:grid-cols-[1fr_220px]">
      {d.id && <input type="hidden" name="id" value={d.id} />}
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-[1fr_7rem_7rem_5rem]">
          <label className="flex flex-col gap-1 text-neutral-400">Nome do evento
            <input name="name" required maxLength={120} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="South Summit Brazil" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-neutral-400">Ano
            <input name="year" maxLength={20} value={d.year} onChange={(e) => set({ year: e.target.value })} placeholder="2026" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-neutral-400">Caso
            <input name="number" maxLength={20} value={d.number} onChange={(e) => set({ number: e.target.value })} placeholder="Nº 006" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-neutral-400">Ordem
            <input name="position" type="number" value={d.position} onChange={(e) => set({ position: Number(e.target.value) })} className={`${input} tabular-nums`} />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-neutral-400">Função
            <input name="role" maxLength={40} value={d.role} onChange={(e) => set({ role: e.target.value })} placeholder="Developer" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-neutral-400">Cidade (no crachá)
            <input name="place" maxLength={60} value={d.place} onChange={(e) => set({ place: e.target.value })} placeholder="Porto Alegre" className={input} />
          </label>
          <label className="flex flex-col gap-1 text-neutral-400">Local completo
            <input name="location" maxLength={160} value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="Cais Mauá, Porto Alegre, RS" className={input} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-neutral-400">Descrição do evento (o bilhete no quadro)
          <textarea name="note" rows={3} maxLength={1200} value={d.note} onChange={(e) => set({ note: e.target.value })} className={input} />
        </label>

        <fieldset className="space-y-2">
          <legend className="mb-1 text-neutral-400">Fotos ({photos.length}/{MAX_PHOTOS}, viram as polaroides do quadro)</legend>
          <div className="flex flex-wrap items-start gap-3">
            {photos.map((p, i) => (
              <figure key={p.src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews and admin thumbnails */}
                <img src={p.src} alt={`Foto ${i + 1}`} className="size-28 rounded-lg border border-neutral-700 object-cover" />
                <button type="button" onClick={p.remove} aria-label={`Remover foto ${i + 1}`}
                  className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full border border-neutral-600 bg-neutral-900 text-xs text-neutral-300 hover:border-red-400 hover:text-red-300">✕</button>
              </figure>
            ))}
            {room > 0 && (
              <label className="grid size-28 cursor-pointer place-items-center rounded-lg border border-dashed border-neutral-600 text-center text-xs text-neutral-400 hover:border-sky-500 hover:text-sky-300">
                <span>+ Enviar foto</span>
                <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { pick(e.target.files); e.target.value = ""; }} />
              </label>
            )}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-neutral-400">Cor
            <input name="color" type="color" value={d.color} onChange={(e) => set({ color: e.target.value })} className="h-8 w-12 cursor-pointer rounded border border-neutral-700 bg-neutral-950" />
          </label>
          <label className="flex items-center gap-2 text-neutral-400">Cor escura
            <input name="darkColor" type="color" value={d.darkColor} onChange={(e) => set({ darkColor: e.target.value })} className="h-8 w-12 cursor-pointer rounded border border-neutral-700 bg-neutral-950" />
          </label>
          <label className="flex items-center gap-2 text-neutral-200">
            <input type="checkbox" name="published" checked={d.published} onChange={(e) => set({ published: e.target.checked })} className="accent-sky-500" /> Publicada
          </label>
          <button disabled={busy} className="ml-auto rounded-lg bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500 disabled:opacity-60">
            {busy ? "Salvando…" : d.id ? "Salvar" : "Adicionar credencial"}
          </button>
        </div>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </div>
      <div className="flex flex-col items-center gap-2">
        <CredentialBadge event={{ ...d, name: d.name || "Nome do evento" }} label="Prévia do crachá" className="w-full max-w-[220px] rounded shadow-lg" />
        <p className="text-center text-xs text-neutral-500">O crachá é desenhado a partir desses dados.</p>
      </div>
    </form>
  );
}
