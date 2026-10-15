import { neon } from "@neondatabase/serverless";
import { STAGES } from "@/components/ui/platformer";

// Read side of the visit log (lib/visits.sql) for /admin. Only call after isAdmin().
const sql = () => neon(process.env.DATABASE_URL!);
export const TZ = "America/Sao_Paulo";

export const PERIODS = [1, 7, 30, 90] as const;
export const period = (d: unknown) => (PERIODS as readonly number[]).includes(Number(d)) ? Number(d) : 30;

type Row = Record<string, unknown>;
export type Count = { label: string | null; n: number; people: number };
// Breakdown columns the dashboard groups visits by; the name goes into SQL, so only these.
const COLUMNS = ["source", "utm_campaign", "country", "city", "device_type", "browser", "os", "landing"] as const;
export type Column = (typeof COLUMNS)[number];

export async function overview(days: number) {
  const q = sql();
  const since = q`now() - make_interval(days => ${days})`;
  // Visitors marked hidden in /admin (the owner, bots, tests) count nowhere.
  const shown = q`visitor not in (select visitor from visitor_labels where hidden)`;
  const [[kpi], daily, breakdowns, actions, [funnel]] = await Promise.all([
    q`select count(*)::int visits, count(distinct visitor)::int visitors,
        coalesce(avg(extract(epoch from last_at - started_at)), 0)::int avg_seconds,
        count(distinct visitor) filter (where visitor in (select visitor from visits group by visitor having count(*) > 1))::int as returners
      from visits where started_at > ${since} and ${shown}`,
    q`select to_char(started_at at time zone ${TZ}, 'YYYY-MM-DD') as day, count(*)::int as n, count(distinct visitor)::int as people
      from visits where started_at > ${since} and ${shown} group by 1 order by 1`,
    Promise.all(COLUMNS.map((c) => q`select ${q.unsafe(c)} as label, count(*)::int as n, count(distinct visitor)::int as people
      from visits where started_at > ${since} and ${shown} group by 1 order by 2 desc limit 12`)),
    q`select e.type, e.name as label, count(*)::int as n, count(distinct v.visitor)::int as people
      from visit_events e join visits v on v.id = e.visit
      where e.at > ${since} and ${shown} and e.type in ('game', 'article', 'credential', 'won', 'stamp', 'share', 'open')
      group by 1, 2 order by 3 desc`,
    // Each step counts people who reached it (or any later step, for the desk: a shared post link opens straight onto it).
    q`with v as (select id, visitor from visits where started_at > ${since} and ${shown}),
      e as (select v.visitor, e.type, e.name from visit_events e join v on v.id = e.visit)
      select (select count(distinct visitor) from v)::int entered,
        (select count(distinct visitor) from e where type in ('desk', 'open', 'credential', 'game', 'article'))::int desk,
        (select count(distinct visitor) from e where type in ('open', 'credential', 'game', 'article'))::int opened,
        (select count(distinct visitor) from e where type = 'game')::int played,
        (select count(distinct visitor) from e where type = 'stamp' and name in ('gerado', 'conde'))::int stamped,
        (select count(distinct visitor) from e where type = 'stamp' and name = 'colado')::int stuck`,
  ]);
  const of = (type: string) => (actions as Row[]).filter((a) => a.type === type) as unknown as Count[];
  return {
    kpi: kpi as { visits: number; visitors: number; avg_seconds: number; returners: number },
    // Every day of the period, including the empty ones.
    daily: Array.from({ length: days }, (_, i) => {
      const day = new Date(Date.now() - (days - 1 - i) * 864e5).toLocaleDateString("en-CA", { timeZone: TZ });
      return (daily as { day: string; n: number; people: number }[]).find((d) => d.day === day) ?? { day, n: 0, people: 0 };
    }),
    by: Object.fromEntries(COLUMNS.map((c, i) => [c, breakdowns[i]])) as unknown as Record<Column, Count[]>,
    funnel: funnel as Record<"entered" | "desk" | "opened" | "played" | "stamped" | "stuck", number>,
    games: of("game"), articles: of("article"), credentials: of("credential"), stages: of("won"), stamps: of("stamp"), shares: of("share"), opens: of("open"),
  };
}

export type VisitorRow = {
  visitor: string; visits: number; first_at: string; last_at: string; seconds: number; source: string; campaign: string | null;
  place: string; device: string; ff: boolean; events: number; games: string[] | null; articles: number; stamps: number[] | null;
  name: string | null; note: string | null; hidden: boolean;
};

// One row per browser, most recent first, with what it played and which stamps (visitor or Count) its devices own.
// Hidden visitors are left out unless `hidden` is set (to find and unhide them).
export async function visitors(days: number, filter: { source?: string; game?: string; hidden?: boolean } = {}) {
  const q = sql();
  return (await q`
    with l as (select * from visitor_labels),
    v as (select * from visits where started_at > now() - make_interval(days => ${days})
      and (${!!filter.hidden}::boolean or visitor not in (select visitor from l where hidden))),
    ev as (select v.visitor, e.type, e.name from visit_events e join v on v.id = e.visit),
    st as (select distinct v.visitor, s.id from v join stamps s on s.seed = v.seed or s.seed = v.count_seed)
    select v.visitor, count(*)::int visits, min(v.started_at) first_at, max(v.last_at) last_at,
      sum(extract(epoch from v.last_at - v.started_at))::int seconds,
      (array_agg(v.source order by v.started_at))[1] source,
      (array_agg(v.utm_campaign order by v.started_at) filter (where v.utm_campaign is not null))[1] campaign,
      (array_agg(concat_ws(', ', v.city, v.region, v.country) order by v.started_at desc))[1] place,
      (array_agg(concat_ws(' · ', v.device_type, v.browser, v.os) order by v.started_at desc))[1] device,
      bool_or(v.ff) ff,
      (select count(*) from ev where ev.visitor = v.visitor and ev.type not in ('show', 'hide'))::int events,
      (select array_agg(distinct name) from ev where ev.visitor = v.visitor and ev.type = 'game') games,
      (select count(distinct name) from ev where ev.visitor = v.visitor and ev.type = 'article')::int articles,
      (select array_agg(id order by id) from st where st.visitor = v.visitor) stamps,
      (select name from l where l.visitor = v.visitor) name, (select note from l where l.visitor = v.visitor) note,
      coalesce((select hidden from l where l.visitor = v.visitor), false) hidden
    from v group by v.visitor
    having (${filter.source ?? null}::text is null or (array_agg(v.source order by v.started_at))[1] = ${filter.source ?? null})
      and (${filter.game ?? null}::text is null or exists (select 1 from ev where ev.visitor = v.visitor and ev.type = 'game' and ev.name = ${filter.game ?? null}))
    order by max(v.last_at) desc limit 200`) as VisitorRow[];
}

// Everything about one browser: its visits with their timelines, plus the stamps, score and castle progress linked to it.
export async function visitor(id: string) {
  const q = sql();
  const visits = (await q`select * from visits where visitor = ${id} order by started_at desc`) as Row[];
  if (!visits.length) return null;
  const ids = visits.map((v) => v.id as string);
  const seeds = visits.map((v) => v.seed as number);
  const allSeeds = [...seeds, ...visits.map((v) => v.count_seed as number)];
  const castles = visits.map((v) => v.castle as string | null).filter((c): c is string => !!c);
  const [timeline, stamps, scores, castle, [label]] = await Promise.all([
    q`select id, visit, type, name, detail, at from visit_events where visit = any(${ids}::uuid[]) order by at, id`,
    q`select id, seed, ff, beans, face, country, created_at from stamps where seed = any(${allSeeds}::int[]) order by id`,
    q`select best, name, updated_at from scores where seed = any(${seeds}::int[]) order by best desc`,
    castles.length ? q`select cleared, best, updated_at from castle where key = any(${castles}::uuid[]) order by cleared desc` : Promise.resolve([]),
    q`select name, note, hidden from visitor_labels where visitor = ${id}`,
  ]);
  return {
    visits: visits.map((v) => ({ ...v, events: (timeline as Row[]).filter((e) => e.visit === v.id) }) as Row & { events: Row[] }),
    stamps: stamps as { id: number; ff: boolean; beans: number | null; face: number | null; country: string | null; created_at: string }[],
    scores: scores as { best: number; name: string | null; updated_at: string }[],
    castle: castle as { cleared: number; best: number[]; updated_at: string }[],
    label: (label ?? { name: null, note: null, hidden: false }) as { name: string | null; note: string | null; hidden: boolean },
  };
}

// Human labels (pt-BR) for event rows and breakdown keys.
const GAMES: Record<string, string> = { "paper-toss": "Basquete de papel", "coffee-run": "Castelo do Café" };
export const gameName = (g: string | null) => (g && GAMES[g]) ?? g ?? "—";
// `names`: credential id → event name, from getCredentials().
export const credentialName = (c: string | null, names: Record<string, string> = {}) => (c && names[c]) ?? c ?? "—";
export const stageName = (s: string | null) => STAGES[Number(s)]?.name ?? `fase ${s}`;
export const stampNo = (n: number) => `Nº ${String(n).padStart(4, "0")}`;

export function describe(e: { type: string; name: string | null; detail: Record<string, unknown> | null }, titles: Record<string, string>, credentials: Record<string, string> = {}) {
  const d = e.detail ?? {};
  switch (e.type) {
    case "view": return `Abriu a página ${e.name}`;
    case "desk": return "Rolou até a mesa";
    case "show": return "Voltou para a aba";
    case "hide": return "Saiu da aba";
    case "open": return `Abriu o ${e.name}`;
    case "article": return `Leu o artigo “${titles[e.name ?? ""] ?? e.name}”`;
    case "share": return `Compartilhou o artigo “${titles[e.name ?? ""] ?? e.name}”`;
    case "credential": return `Abriu a credencial ${credentialName(e.name, credentials)}`;
    case "game": return `Começou a jogar ${gameName(e.name)}`;
    case "score": return `Basquete de papel: ${d.throws} arremessos, melhor sequência ${d.max}`;
    case "stage": return `Castelo do Café: entrou na fase ${Number(e.name) + 1} (${stageName(e.name)})`;
    case "won": return `Castelo do Café: venceu a fase ${Number(e.name) + 1} (${stageName(e.name)}) com ${d.beans} grãos`;
    case "stamp":
      if (e.name === "conde") return `Venceu o Conde D'arábica e ganhou o selo do Conde (${d.beans}% dos grãos)`;
      return `${e.name === "colado" ? "Colou" : "Gerou"} o selo ${typeof d.id === "number" ? stampNo(d.id) : ""}${e.name === "colado" ? ` na página ${d.face}` : ""}`;
    default: return `${e.type} ${e.name ?? ""}`;
  }
}
