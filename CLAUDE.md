# Draft Room — current state

> Read this before touching the app. Update it the MOMENT an infra fact changes (database, domain, auth) — don't wait for session end. Append an entry to docs/SESSIONS.md at the end of every working session. (This system exists because on 2026-07-14 a session wrote hours of content to the wrong Supabase project — the move was documented nowhere.)

## What this is

Draft Room is a season-long baseball prediction game tracker for the 2026 MLB season, built by Scott with his son Ty and inspired by the **Talkin' Baseball** podcast. Seven games (Free Agent draft, Cy Young, Position Units, HR Team, Trade Deadline, Awards, Win O/U) with live scoring that updates as the real season plays out; since the 2026-04-29 multi-user rebuild it supports multiple auth-backed players plus "show host" accounts scored from the podcast's own picks. **Lane: Personal/Family.**

## Infrastructure — VERIFY BEFORE ANY DB WRITE

- **Supabase:** project ref `isogetmvnpimcmouakeg` — **SHARED project** — schema/auth changes affect the other apps on `isogetmvnpimcmouakeg` (Duty, Magnify, Knit, mc-staff, Dream Home, Planet Rivals, Sparkle Pro, …). Confirm the ref before every DB write.
- **Table prefix: NONE.** This app's tables are **unprefixed** on the shared project: `players`, `player_picks`, `games_config`, `app_settings`, `youtube_comments`, plus the legacy single-row `draft_room` table (kept as backup after the multi-user migration). Generic names like `players` are easy to confuse with another app's tables — double-check ownership before altering anything.
- **Auth:** shared Supabase Auth; client uses a namespaced localStorage `storageKey: 'draft-room-auth-token'` to avoid token-refresh deadlocks with other apps on the same ref (see `src/lib/supabase.ts`).
- **Hosting/domain:** Vercel project `draft-room` → production at **https://draft-room-nine.vercel.app** (no custom domain).
- **GitHub remote:** `origin` → https://github.com/sendscott-del/draft-room (branch `main`; local folder is `draft-room-new`; push = deploy via Vercel).
- **Serverless + crons:** `api/update-stats.ts` (daily 06:00 UTC) and `api/youtube-comments.ts` (daily 14:00 UTC) run as Vercel functions with `maxDuration: 300` (Hobby-plan limit) — see `vercel.json`.
- **Env (names only):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `YOUTUBE_API_KEY` (server-side, for comment/transcript ingestion).

## Architecture snapshot

- **Stack:** Vite + React 19 + TypeScript, Tailwind 4 (`@tailwindcss/vite`), supabase-js. "Studio Talk" design (v1.6.0): cream paper, navy ink, studio red, ballpark gold, Oswald.
- **Key dirs:** `src/components/games/` (one component per game), `src/lib/` (`scoring.ts`, `scoring-per-user.ts`, `leaderboard-scoring.ts`, `locks.ts`, projections: `cyProjection.ts`, `awardsProjection.ts`, `psProjection.ts`, `data-adapter.ts`), `src/data/` (constants, defaults, `faActuals.ts`), `api/` (Vercel functions), `supabase/migrations/`, `transcripts/` (show transcripts), `scripts/`.
- **Data model:** one JSONB blob per player in `player_picks.data` (shape = `UserAppData` in `src/types.ts`); `games_config` holds per-game status (`final`/`interim`) and source YouTube video IDs; `youtube_comments` caches fetched comments.
- **Lock logic** (`src/lib/locks.ts`): FA/CY/PU/HR permanently locked (draft done); TD open until deadline; AW/OU locked at season start. Season dates: lock 2026-03-27, trade deadline 2026-08-03, season end 2026-09-28.
- **"Update the stats"** means updating WAR / HR totals / CY votes / actual win totals — not the picks. The daily `update-stats` cron automates most of this (FanGraphs/odds sources, per-fetch timeouts so one hung upstream can't block the job).

## Rules for this repo

- Version in `package.json` (currently 1.7.0); shipped changes bump it and update `RELEASE_NOTES.md` + `USER_GUIDE.md`.
- Deploy = push to `origin main`; Vercel auto-deploys. Test on the deployed URL.
- Schema changes go in `supabase/migrations/`.
- Append a docs/SESSIONS.md entry at the end of every working session; update this file immediately when an infra fact changes.
- No secrets in committed files — env var names only. One unrelated uncommitted item (`.claude/`) may sit in the working tree; leave it alone.

## Gotchas

- **Unprefixed tables on a shared Supabase** (see above) — the biggest foot-gun in this repo.
- **Auth storageKey namespacing is load-bearing** — removing it re-introduces cross-app navigator-locks deadlocks on `sb-{ref}-auth-token`.
- **Scoring changes ripple:** per-pick scoring, per-user scoring, and leaderboard scoring live in three files; the deep-merge on load must preserve extra saved fields (`projected`, `stats`, `liveOdds`) — a past bug dropped them.
- Vercel Hobby caps function duration at 300s; the cron jobs are tuned to that (parallelized fetches + 8s/20s timeouts).

## Historical notes (pre-migration; stale — do not follow)

The original CLAUDE.md in this repo was a one-time **migration spec** (vanilla-JS single `index.html` on GitHub Pages + Google Apps Script/Sheets → this Vite/React/Supabase/Vercel app). That migration completed in April 2026. Kept for the record:

- Old stack: single `index.html`, hosted at `sendscott-del.github.io/draft-room`, data via a Google Apps Script endpoint (retired once Supabase was confirmed working).
- The migration created the single-row `draft_room` table (one shared JSONB blob, public read/write RLS, no auth — "private family app"). **Stale:** the 2026-04-29 multi-user rebuild (`supabase/migrations/20260429_001_auth_and_players.sql`) replaced that model with auth-backed `players`/`player_picks`/`games_config`; `draft_room` remains only as an un-deleted backup.
- The spec's dark-navy theme/colors were replaced by the "Studio Talk" redesign (v1.6.0); its step-by-step scaffolding (npm create vite, initial schema SQL, Apps Script data migration, per-game default pick data, original component list) is all done and superseded by the code itself.
- Still-true ideas that were carried forward: scoring rules per game (FA team/contract/award bonuses; CY = votes; PU = WAR sum; HR = HR sum; TD 10/5/5; Awards 25/10/5; OU 3 per correct), the lock/countdown dates above, debounced auto-save with merge-on-load, and the FINAL/INTERIM badge model (now DB-driven via `games_config.status`).
