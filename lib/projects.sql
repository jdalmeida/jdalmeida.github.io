-- Personal projects shown in the notebook's "Projetos" section, edited in /admin/projetos (run once on the Neon database).
create table if not exists projects (
  id serial primary key,
  name text not null,
  year text,                         -- free text: "2026", "2024–2025"
  description text not null default '',
  tags jsonb not null default '[]',  -- ["Next.js", "WebGL"]
  links jsonb not null default '[]', -- [{"label": "Código", "href": "https://..."}]
  position integer not null default 0, -- notebook order, lowest first
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- First project, so the section isn't empty (only on an empty table).
insert into projects (name, year, description, tags, links)
select 'Esta escrivaninha', '2026',
  'Meu portfólio: uma mesa em WebGL com caderno de artigos, livro de visitas com selos gerados a partir do dispositivo, credenciais de eventos e alguns joguinhos escondidos.',
  '["Next.js", "WebGL", "Postgres"]', '[{"label": "Código", "href": "https://github.com/jdalmeida/jdalmeida.github.io"}]'
where not exists (select 1 from projects);
