-- Visitor stamps (run once on the Neon database).
create table if not exists stamps (
  id serial primary key,           -- visitor number
  seed integer not null unique,    -- device hash; one stamp per device
  ff boolean not null default false, -- Family & Friends
  country text,
  face smallint,                   -- notebook face; null = generated, not stuck yet
  x real,                          -- % of face width
  y real,                          -- % of face height (can pass 100 on scrolling pages)
  created_at timestamptz not null default now()
);

-- Paper-toss best streak per device (same seed as stamps). A high score raises that device's stamp rarity.
create table if not exists scores (
  seed integer primary key,
  best integer not null default 0,
  name text,                       -- set by the player; only named rows show on the leaderboard
  updated_at timestamptz not null default now() -- when `best` was reached; ties go to whoever got there first
);

-- Café castle platformer progress, keyed by a random id the browser keeps in localStorage.
create table if not exists castle (
  key uuid primary key,
  cleared smallint not null default 0, -- stages cleared, in order
  best smallint[] not null default '{}', -- most beans per stage
  updated_at timestamptz not null default now()
);
