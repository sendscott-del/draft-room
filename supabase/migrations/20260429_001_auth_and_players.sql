-- Draft Room: multi-user + show accounts migration
-- Adds auth-backed players, per-player picks, game config, and YouTube comment cache.
-- Existing `draft_room` table is left in place as a backup until manual cleanup.

-- ---------------------------------------------------------------------------
-- 1. players: one row per "person with picks" (logged-in user OR show host)
-- ---------------------------------------------------------------------------
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  display_name text not null,
  -- For show hosts, a stable handle ('jomboy_', 'jolly_olive', etc.) used to match comments
  handle text unique,
  is_show_account boolean not null default false,
  is_public boolean not null default true,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists players_is_show_idx on players(is_show_account) where is_show_account = true;
create index if not exists players_is_public_idx on players(is_public) where is_public = true;

-- ---------------------------------------------------------------------------
-- 2. player_picks: per-player game picks (one row per player, JSONB blob)
-- ---------------------------------------------------------------------------
-- The JSONB shape matches `UserAppData` in src/types.ts:
--   { fa: FAPickPersonal[], cy: CYPick[], pu: PUPick[],
--     hr: Record<string,HRSlot>, td: TDPickPersonal[], aw: AwardPicks,
--     ou: Record<string,OUPick> }
create table if not exists player_picks (
  player_id uuid primary key references players(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. games_config: per-game metadata (status, source video IDs)
-- ---------------------------------------------------------------------------
create table if not exists games_config (
  game_key text primary key check (game_key in ('fa','cy','pu','hr','td','aw','ou')),
  name text not null,
  status text not null default 'interim' check (status in ('final','interim')),
  -- YouTube videos where the show made these picks; used to seed transcript pulls + comment fetches.
  source_video_ids text[] not null default '{}',
  comment_filter_handles text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into games_config (game_key, name, status) values
  ('fa', 'Free Agent Draft', 'final'),
  ('cy', 'Cy Young Draft',   'interim'),
  ('pu', 'Position Units',   'interim'),
  ('hr', 'HR Team',          'interim'),
  ('td', 'Trade Deadline',   'interim'),
  ('aw', 'Awards',           'interim'),
  ('ou', 'Win Over/Under',   'interim')
on conflict (game_key) do nothing;

-- ---------------------------------------------------------------------------
-- 4. youtube_comments: cached comments per video, filtered by host handle
-- ---------------------------------------------------------------------------
create table if not exists youtube_comments (
  comment_id text primary key,
  video_id text not null,
  game_key text references games_config(game_key) on delete set null,
  author_channel_id text,
  author_handle text,        -- normalized to lowercase
  author_display_name text,
  text_plain text,
  text_html text,
  published_at timestamptz,
  like_count int not null default 0,
  fetched_at timestamptz not null default now()
);

create index if not exists youtube_comments_game_pub_idx
  on youtube_comments(game_key, published_at desc);
create index if not exists youtube_comments_video_idx
  on youtube_comments(video_id, published_at desc);

-- ---------------------------------------------------------------------------
-- 5. RLS policies
-- ---------------------------------------------------------------------------
alter table players       enable row level security;
alter table player_picks  enable row level security;
alter table games_config  enable row level security;
alter table youtube_comments enable row level security;

-- Players: any authenticated user can read public players or show accounts.
-- A user can read their own player row regardless of is_public.
drop policy if exists "players_read" on players;
create policy "players_read" on players
  for select to authenticated
  using (is_public = true or is_show_account = true or user_id = auth.uid());

-- Players: a user can update only their own profile.
drop policy if exists "players_update_own" on players;
create policy "players_update_own" on players
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Players: a user can insert only a row tied to their own auth id.
-- (Show accounts are inserted by service role, not via this policy.)
drop policy if exists "players_insert_own" on players;
create policy "players_insert_own" on players
  for insert to authenticated
  with check (user_id = auth.uid() and is_show_account = false);

-- player_picks: read if you can see the player (mirrors players_read).
drop policy if exists "player_picks_read" on player_picks;
create policy "player_picks_read" on player_picks
  for select to authenticated
  using (
    exists (
      select 1 from players p
      where p.id = player_picks.player_id
      and (p.is_public = true or p.is_show_account = true or p.user_id = auth.uid())
    )
  );

-- player_picks: write only your own.
drop policy if exists "player_picks_write_own" on player_picks;
create policy "player_picks_write_own" on player_picks
  for all to authenticated
  using (
    exists (
      select 1 from players p
      where p.id = player_picks.player_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from players p
      where p.id = player_picks.player_id and p.user_id = auth.uid()
    )
  );

-- games_config: readable to all auth users; writable only by service role (admin imports).
drop policy if exists "games_config_read" on games_config;
create policy "games_config_read" on games_config
  for select to authenticated using (true);

-- youtube_comments: read-only for users; writes via service role from cron.
drop policy if exists "youtube_comments_read" on youtube_comments;
create policy "youtube_comments_read" on youtube_comments
  for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- 6. updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_players_updated_at on players;
create trigger trg_players_updated_at before update on players
  for each row execute function set_updated_at();

drop trigger if exists trg_player_picks_updated_at on player_picks;
create trigger trg_player_picks_updated_at before update on player_picks
  for each row execute function set_updated_at();

drop trigger if exists trg_games_config_updated_at on games_config;
create trigger trg_games_config_updated_at before update on games_config
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Player auto-creation
-- ---------------------------------------------------------------------------
-- NOTE: this Supabase project hosts multiple apps (Sparkle Pro, Steward, Knit,
-- Tidings, Bloom, Duty, etc.) sharing one auth.users table. We deliberately do
-- NOT add an auth.users trigger here, because that would create a Draft Room
-- player row for every new signup across every other app.
--
-- Instead, the Draft Room client (src/lib/auth-context.tsx) creates the
-- player row on first authenticated load if one is missing. That scopes
-- player creation to actual Draft Room users only.
