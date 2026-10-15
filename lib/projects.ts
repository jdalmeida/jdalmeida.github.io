import { neon } from "@neondatabase/serverless";

export type ProjectLink = { label: string; href: string };
export type Project = { id: number; name: string; year: string | null; description: string; tags: string[]; links: ProjectLink[] };

// Table: see lib/projects.sql; edited in /admin/projetos.
export async function getProjects(): Promise<Project[]> {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    return (await sql`select id, name, year, description, tags, links from projects where published order by position, id`) as Project[];
  } catch (e) {
    // Table not created yet (42P01): the notebook just has no projects section, instead of the home page failing.
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}
