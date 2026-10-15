-- Visit log for the /admin dashboard (run once on the Neon database, like lib/stamps.sql).
-- A visit is one browser tab session (new one after 30 min idle); `visitor` is a random id kept in localStorage, so it follows the browser.
create table if not exists visits (
  id uuid primary key,
  visitor uuid not null,
  seed integer,                    -- device seed, same hash as stamps.seed / scores.seed (lib/device.ts)
  count_seed integer,              -- seed of the Count D'arábica stamp (salt "conde")
  castle uuid,                     -- castle.key, once the visitor opened the coffee castle
  landing text,                    -- first path seen
  referrer text,                   -- full document.referrer
  source text,                     -- utm_source / ref, else referrer host, else "direto"
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  ff boolean not null default false, -- arrived through a Family & Friends link (the token itself isn't stored)
  country text,
  region text,
  city text,
  device_type text,                -- mobile / tablet / desktop
  browser text,
  os text,
  language text,
  screen text,
  user_agent text,
  started_at timestamptz not null default now(),
  last_at timestamptz not null default now()
);
create index if not exists visits_started on visits (started_at desc);
create index if not exists visits_visitor on visits (visitor);

-- What happened during a visit: page views, opened things, games, stamps. See lib/track.ts for the types.
create table if not exists visit_events (
  id bigserial primary key,
  visit uuid not null references visits (id) on delete cascade,
  type text not null,
  name text,
  detail jsonb,
  at timestamptz not null default now()
);
create index if not exists visit_events_visit on visit_events (visit, at);
create index if not exists visit_events_type on visit_events (type, at desc);

-- Names the owner gives visitors in /admin. `hidden` drops a visitor (the owner, a bot, a test) from every number.
create table if not exists visitor_labels (
  visitor uuid primary key,
  name text,
  note text,
  hidden boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Tracked links made in /admin (UTM builder); visits are matched by source + campaign.
create table if not exists campaign_links (
  id serial primary key,
  label text not null,
  source text not null,
  medium text,
  campaign text not null,
  content text,
  path text not null default '/',
  created_at timestamptz not null default now()
);
