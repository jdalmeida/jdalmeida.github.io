import { neon } from "@neondatabase/serverless";

// Photos uploaded in /admin/credenciais. A photo is never changed in place (replacing it uploads a new id), so it caches forever.
export async function GET(_: Request, ctx: RouteContext<"/api/credenciais/foto/[id]">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("Not found", { status: 404 });
  const [row] = (await neon(process.env.DATABASE_URL!)`select type, encode(data, 'base64') data from credential_photos where id = ${id}`) as { type: string; data: string }[];
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(row.data, "base64"), {
    headers: { "Content-Type": row.type, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
