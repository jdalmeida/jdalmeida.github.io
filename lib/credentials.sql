-- Event credentials on the desk (badge pile + evidence board), edited in /admin/credenciais (run once on the Neon database).
create table if not exists credentials (
  id text primary key,                -- slug, also the name in visit_events ("credential", id): never changes
  name text not null,
  year text not null default '',
  location text not null default '',  -- full address, on the case card
  place text not null default '',     -- city, on the badge
  role text not null default '',
  number text not null default '',    -- "Nº 001"
  color text not null default '#153df5',
  dark_color text not null default '#0a1f8a',
  note text not null default '',      -- the description pinned on the board
  images jsonb not null default '[]', -- up to two photo URLs: /credentials/... or /api/credenciais/foto/<id>
  position integer not null default 0, -- pile order, lowest first
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Photos uploaded in the admin (already resized to WebP in the browser), served by /api/credenciais/foto/<id>.
create table if not exists credential_photos (
  id serial primary key,
  type text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);

-- The credentials that used to live in lib/events.json (only on an empty table).
insert into credentials (id, name, year, location, place, role, number, color, dark_color, note, images, position)
select * from (values
  ('inovathon-vrp', 'Inovathon Vale do Rio Pardo', '2026', 'UNISC, Santa Cruz do Sul, RS', 'Santa Cruz do Sul', 'Developer', 'Nº 001', '#0a7d4f', '#063c26',
    'Raízes locais, soluções globais. Um fim de semana no Living Vales para tirar do papel uma solução com cara do Vale do Rio Pardo.',
    '["/credentials/inovathon1-960.webp", "/credentials/inovathon2-960.webp"]'::jsonb, 1),
  ('south-summit', 'South Summit Brazil', '2026', 'Cais Mauá, Porto Alegre, RS', 'Porto Alegre', 'Corps', 'Nº 002', '#c8102e', '#6d0a1a',
    'Três dias no Cais Mauá entre startups, palcos e café. Uma credencial do lado de quem faz o evento acontecer.',
    '["/credentials/ss_brazil1-960.webp", "/credentials/ss_brazil2-960.webp"]'::jsonb, 2),
  ('amcham-sx', 'Amcham SX', '2025', 'Vinícola Luiz Argenta, Flores da Cunha, RS', 'Flores da Cunha', 'Atendee', 'Nº 003', '#153df5', '#0a1f8a',
    'Um encontro anual sobre inovação e negócios, com boas palestras e muitas conexões.',
    '["/credentials/sx1-960.webp", "/credentials/sx2-960.webp"]'::jsonb, 3),
  ('techstars-sw', 'Techstars Startup Weekend', '2025', 'Lajeado, RS', 'Lajeado', 'Developer', 'Nº 004', '#2b2f36', '#0a0a0b',
    'Foram 54 horas para tirar uma ideia do papel. O time nasceu na sexta e apresentou o produto no domingo.',
    '["/credentials/sw_lajeado1-960.webp", "/credentials/sw_lajeado2-960.webp"]'::jsonb, 4),
  ('hackathon-va', '3º Hackathon de Venâncio Aires', '2024', 'Venâncio Aires, RS', 'Venâncio Aires', 'Dev & Leader', 'Nº 005', '#0f31cc', '#091747',
    'O evento onde as startups viraram parte da minha vida.',
    '["/credentials/hackathon1-960.webp", "/credentials/hackathon2-960.webp"]'::jsonb, 5)
) as seed
where not exists (select 1 from credentials);
