# Draft Room — Session Log

Append-only, newest first. Every working session gets an entry: date, what changed, any infra facts touched.

## 2026-07-15 — Doc system initialized (history reconstructed from git)

- 2026-05-19 — v1.7.0 mobile responsive pass.
- 2026-05-02 — v1.6.0 "Studio Talk" redesign (cream paper, Oswald, hard borders) replacing the original dark-navy theme.
- 2026-04-30 — global 2026 FA signings table so every host scores; standings clarity; CY placement scoring; Postseason projection from FanGraphs playoff odds; OU show episodes 6–8 ingested (30/30 teams).
- 2026-04-29 — **multi-user rebuild**: Supabase Auth, `players`/`player_picks`/`games_config`/`youtube_comments` tables (migration `20260429_001_auth_and_players.sql`), show-picks ingestion, seasons, multi-player game tabs; legacy single-row `draft_room` table kept as backup.
- 2026-04-29 — cron hardening: `update-stats` parallelized with per-fetch 8s/20s timeouts, `maxDuration` lowered to 300s (Hobby limit).
- 2026-04-07 — automation wave: automatic WAR updates (Position Units), CY pitcher stats + live odds, CY vote projection calibrated to 2025 BBWAA results, awards forecast from betting odds, FanGraphs projected wins for O/U; deep-merge fix to preserve `projected`/`stats`/`liveOdds` fields.
- 2026-04-07 — O/U scoring bug fixed; info popups explaining forecast methodology; Edge-runtime switch for API routes.
- Pre-April 2026 — original app was a single vanilla-JS `index.html` on GitHub Pages with a Google Apps Script/Sheets backend; migrated to Vite + React + Supabase + Vercel per the migration spec now archived under "Historical notes" in CLAUDE.md.
