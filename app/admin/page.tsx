import type { Metadata } from "next";
import Link from "next/link";
import NoTrack from "@/components/admin/no-track";
import { BarList, Card, DailyChart, duration, flag, Kpi, when } from "@/components/admin/ui";
import { isAdmin } from "@/lib/admin";
import { credentialName, gameName, overview, period, PERIODS, stageName, stampNo, visitors } from "@/lib/analytics";
import { getArticles } from "@/lib/articles";
import { login, logout } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const DEVICES: Record<string, string> = { mobile: "Celular", tablet: "Tablet", desktop: "Computador" };

export default async function Admin({ searchParams }: PageProps<"/admin">) {
  const q = await searchParams;
  if (!(await isAdmin())) return <Login error={!!q.erro} />;

  const days = period(q.d);
  const source = typeof q.origem === "string" ? q.origem : undefined;
  const game = typeof q.jogo === "string" ? q.jogo : undefined;
  const hidden = q.ocultos === "1";
  const [data, people, titles] = await Promise.all([
    overview(days), visitors(days, { source, game, hidden }),
    getArticles().then((a) => Object.fromEntries(a.map((x) => [x.slug, x.title])), () => ({} as Record<string, string>)),
  ]);
  const link = (extra: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ d: days, origem: source, jogo: game, ocultos: hidden ? 1 : undefined, ...extra })) if (v !== undefined && v !== "") p.set(k, String(v));
    return `/admin?${p}`;
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-200 sm:px-8">
      <NoTrack />
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="mr-auto text-xl font-semibold text-neutral-50">Analytics do site</h1>
          <nav className="flex rounded-lg border border-neutral-800 p-0.5 text-sm" aria-label="Período">
            {PERIODS.map((p) => (
              <Link key={p} href={link({ d: p })} className={`rounded-md px-3 py-1 ${p === days ? "bg-neutral-800 text-neutral-50" : "text-neutral-400 hover:text-neutral-200"}`}>
                {p === 1 ? "24h" : `${p} dias`}
              </Link>
            ))}
          </nav>
          <form action={logout}><button className="rounded-lg border border-neutral-800 px-3 py-1 text-sm text-neutral-400 hover:text-neutral-200">Sair</button></form>
        </header>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi label="Visitas" value={data.kpi.visits} hint="sessões de navegação" />
          <Kpi label="Pessoas" value={data.kpi.visitors} hint="navegadores diferentes" />
          <Kpi label="Tempo médio" value={duration(data.kpi.avg_seconds)} hint="por visita" />
          <Kpi label="Voltaram" value={data.kpi.returners} hint="pessoas com mais de uma visita" />
        </div>

        <Card title="Visitas por dia">{data.daily.length > 1 ? <DailyChart days={data.daily} /> : <p className="text-sm">{data.kpi.visits} visitas nas últimas 24h.</p>}</Card>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Card title="De onde vieram"><BarList rows={data.by.source} href={(l) => link({ origem: l ?? undefined })} /></Card>
          <Card title="Campanhas (utm_campaign)"><BarList rows={data.by.utm_campaign.filter((r) => r.label)} empty="Nenhum link com utm_campaign." /></Card>
          <Card title="Página de entrada"><BarList rows={data.by.landing} /></Card>
          <Card title="Países"><BarList rows={data.by.country} label={flag} /></Card>
          <Card title="Cidades"><BarList rows={data.by.city} /></Card>
          <Card title="Dispositivos"><BarList rows={data.by.device_type} label={(l) => DEVICES[l ?? ""] ?? l ?? "—"} /></Card>
          <Card title="Navegadores"><BarList rows={data.by.browser} /></Card>
          <Card title="Sistemas"><BarList rows={data.by.os} /></Card>
          <Card title="Jogos"><BarList rows={data.games} label={gameName} href={(l) => link({ jogo: l ?? undefined })} empty="Ninguém jogou ainda." /></Card>
          <Card title="Castelo do Café: fases vencidas"><BarList rows={data.stages} label={(l) => `${Number(l) + 1}. ${stageName(l)}`} /></Card>
          <Card title="Artigos lidos"><BarList rows={data.articles} label={(l) => titles[l ?? ""] ?? l} /></Card>
          <Card title="Credenciais abertas"><BarList rows={data.credentials} label={credentialName} /></Card>
          <Card title="Selos e compartilhamentos">
            <BarList rows={[...data.stamps.map((s) => ({ ...s, label: `Selo ${s.label}` })), ...data.shares.map((s) => ({ ...s, label: `Compartilhou ${titles[s.label ?? ""] ?? s.label}` }))]} />
          </Card>
        </div>

        <Card title={`Visitantes (${people.length}${people.length === 200 ? "+" : ""})`}>
          {(source || game) && (
            <p className="mb-3 text-sm text-neutral-400">
              Filtrando {source && <>origem <b className="text-neutral-200">{source}</b></>} {game && <>jogo <b className="text-neutral-200">{gameName(game)}</b></>} ·{" "}
              <Link className="text-sky-400 hover:underline" href={link({ origem: "", jogo: "" })}>limpar</Link>
            </p>
          )}
          <p className="mb-3 text-xs text-neutral-500">
            Abra a jornada de alguém para dar um nome ou ocultar (você, bots, testes): ocultos saem de todos os números.{" "}
            <Link className="text-sky-400 hover:underline" href={link({ ocultos: hidden ? "" : 1 })}>{hidden ? "Esconder ocultos" : "Mostrar ocultos"}</Link>
          </p>
          <div className="-mx-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-neutral-500">
                <tr>{["Quem", "Última visita", "Origem", "Local", "Dispositivo", "Visitas", "Tempo", "Jogos", "Artigos", "Selo", ""].map((h) => <th key={h} className="px-4 py-2 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {people.map((p) => (
                  <tr key={p.visitor} className={`hover:bg-neutral-800/40 ${p.hidden ? "opacity-50" : ""}`}>
                    <td className="max-w-40 px-4 py-2" title={p.note ?? undefined}>
                      {p.name ? <b className="font-medium text-neutral-50">{p.name}</b> : <span className="font-mono text-xs text-neutral-500">{p.visitor.slice(0, 8)}</span>}
                      {p.hidden && <span className="ml-1 text-xs text-neutral-500">oculto</span>}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{when(p.last_at)}</td>
                    <td className="px-4 py-2">{p.source}{p.campaign && <span className="text-neutral-500"> · {p.campaign}</span>}{p.ff && <span className="ml-1 rounded bg-amber-500/20 px-1 text-xs text-amber-300">F&F</span>}</td>
                    <td className="px-4 py-2">{p.place || "—"}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-neutral-400">{p.device}</td>
                    <td className="px-4 py-2 tabular-nums">{p.visits}</td>
                    <td className="px-4 py-2 tabular-nums whitespace-nowrap">{duration(p.seconds)}</td>
                    <td className="px-4 py-2">{p.games?.map(gameName).join(", ") ?? <span className="text-neutral-600">—</span>}</td>
                    <td className="px-4 py-2 tabular-nums">{p.articles || <span className="text-neutral-600">—</span>}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{p.stamps?.map(stampNo).join(", ") ?? <span className="text-neutral-600">—</span>}</td>
                    <td className="px-4 py-2 whitespace-nowrap"><Link className="text-sky-400 hover:underline" href={`/admin/visitante/${p.visitor}`}>jornada →</Link></td>
                  </tr>
                ))}
                {!people.length && <tr><td colSpan={11} className="px-4 py-6 text-center text-neutral-500">Nenhuma visita nesse período.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}

function Login({ error }: { error: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-200">
      <NoTrack />
      <form action={login} className="w-full max-w-xs space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-6">
        <h1 className="text-lg font-semibold text-neutral-50">Admin</h1>
        {!process.env.ADMIN_PASSWORD && <p className="text-sm text-amber-300">Defina ADMIN_PASSWORD nas variáveis de ambiente para entrar.</p>}
        <label className="block text-sm text-neutral-400" htmlFor="password">Senha</label>
        <input id="password" name="password" type="password" required autoFocus autoComplete="current-password"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-neutral-100 outline-none focus:border-sky-500" />
        {error && <p className="text-sm text-red-400" role="alert">Senha incorreta.</p>}
        <button className="w-full rounded-lg bg-sky-600 px-3 py-2 font-medium text-white hover:bg-sky-500">Entrar</button>
      </form>
    </main>
  );
}
