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
