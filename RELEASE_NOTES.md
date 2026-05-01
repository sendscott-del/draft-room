# Draft Room — Release Notes

## v1.3.1 — Bugfix follow-up

**Date:** 2026-04-30

### Stability

- **No more random page reloads.** The auth context was re-fetching the
  current user's profile every time Supabase rotated its access token
  (~every 50 minutes), which propagated as a data refetch and could
  clobber in-flight edits. The auth listener now only refetches profile
  on actual sign-in / sign-out, and the picks-load effect depends on
  `profile.id` (a stable primitive) instead of the profile object's
  reference identity.

### Standings page

- **Total now sums even before Trade Deadline + Postseason.** Those games
  happen later in the year, so they no longer count against the
  "complete slate" check that gates a player's running total. NA still
  appears in their cells until they've actually picked.
- **Column headers now have short labels** (FA / CY / PU / HR / TD / AW
  / O/U / PS) under each emoji so they're readable at a glance.

### Free Agent

- **Card row heights are uniform.** Each pick card is forced to a
  consistent min-height with single-line player names + a fixed slot for
  the "→ signed" line so cards line up across player columns.

### Cy Young

- **Projection no longer distorts when multiple hosts pick the same
  pitcher.** The vote-curve algorithm was treating each pick as its own
  rank slot, so e.g. Skubal being picked by Scott + Trevor pushed him
  *down* the curve instead of stacking his score. The projection now
  dedupes by pitcher first (taking the strongest odds + most data-rich
  stats line across picks) before applying the rank curve.
- **MacKenzie Gore corrected to NL.** He was mislabeled as AL in Jolly
  Olive's picks, which was siphoning Gore's projection into the AL pool
  and skewing AL totals.

### Awards

- **Projected forecast now shows on the Awards tab.** Previously the tab
  showed only the actual score (which is 0 until results are entered),
  with no projection. The tab now mirrors Cy Young's behavior — a `~XX`
  forecast appears whenever the actual is 0 and a projection is
  available.
- **Forecast no longer requires live betting odds.** The leaderboard
  awards projection had a guard that skipped the whole projection if no
  odds were stored on the picks blob (which happens when the daily stats
  cron hasn't run recently). The guard is gone — projectAwards has its
  own preseason-favorites fallback so a forecast always shows.

> **Tip:** If awards / CY projections look stale, click **Update Stats**
> in the header to pull fresh betting odds + pitcher stats. The cron
> runs once a day at 06:00 UTC; the button forces an immediate refresh.

---

## v1.3.0 — Show-format alignment + standings table

**Date:** 2026-04-30

### Data alignment

- **Scott + Ty's pick counts now match the show.** Free Agent trimmed from
  16 → 8 picks each, Cy Young from 10 → 5, Position Unit from 12 → 4. The
  earliest rounds are kept (their actual show-format draft picks).
- **Eno Sarris added as a Cy Young participant.** He was the third drafter
  on the CY episode (alongside Trevor + Jolly Olive) and was missing from
  the player roster. His 5 picks (Skenes, Yamamoto, Hunter Brown, Logan
  Gilbert, Chase Burns) are now in.
- **FA scoring now applies to every host.** Previously only Scott + Ty
  scored points because only their picks had `actual` signing strings
  filled in. The app now builds a field-wide actuals lookup (player name →
  signing) so any host who picked the same player gets credit too.

### Standings page

- **New table layout:** every game has its own column (FA, CY, PU, HR, TD,
  AW, OU, PS) plus a Total column. NA appears in cells where a player
  didn't play that game.
- **NA total:** if a player skipped any game, their Total reads "NA" so
  they don't compete with players who played the full slate.
- **Ranking:** complete-slate players are ranked by total; NA-total
  players are listed after them.

### UI fixes

- **Rules page is no longer blank.** A missing rules entry for the
  Postseason game broke the whole page; that's been added.
- **HR Team columns no longer overlap.** The 4-column inline grid has been
  reflowed into a 2-row layout per position so player + team + HR fit
  inside a 220 px column.
- **Postseason rows line up across player columns.** Editable selects and
  read-only spans now share a fixed row height so adjacent player columns
  stay aligned.

### Known gap

- **Win O/U: 11 show teams still have no pick.** ATL, BAL, BOS, CHC, DET,
  HOU, MIL, NYM, NYY, SDP, SFG were not covered in the 5 OU/TPP episodes
  whose transcripts are in the repo. To fill them in, drop the missing
  episode video IDs into `scripts/fetch-comments-cli.mjs` and re-run the
  transcript clean + parse pipeline.

---

## v1.2.0 — Multi-player game tabs

**Date:** 2026-04-29

The 1-on-1 comparison model is gone. Every game tab now shows **every
player who participated**, stacked vertically as cards. The user is
always at the top with edit controls; everyone else is read-only below.

### What changed

- **Game tabs are multi-player.** FA, CY, PU, HR, TD, Awards, OU, and
  Postseason all rewritten. Each renders one card per player who played
  that game, sorted with the user first then by descending score.
- **Did Not Play footnote.** Hosts who skipped a game (e.g. Chris Rose
  on the CY episode, Jimmy O'Brien on FA) appear in a "Did not play
  [Game]" line at the bottom of that game's tab.
- **No more comparison dropdown.** The CompareBar is removed. The header
  banner now compares the user against the current top-scoring opponent
  on the leaderboard.
- **Hardcoded "Scott"/"Ty" labels are gone everywhere.** Each player's
  display name shows above their card.
- **Bundle is smaller** (~434 KB vs ~454 KB) thanks to deleting
  ~1000 lines of legacy two-player code.

### Stats updater speedups

- Odds API loop parallelized + filtered to only the markets we project
  (MVP/RoY/CY/Manager). Was scanning every MLB outright market sequentially.

### Friends feature: deferred

Adding friends to a custom comparison list will come in a follow-up — for
now everyone shares the same view (all hosts + Scott + Ty + future user
signups).

---

## v1.1.0 — Labels + scoring unified

**Date:** 2026-04-29

Followup pass after the v1.0.0 deploy.

### What changed

- **Labels follow the comparison player.** Every game tab (FA, CY, PU, HR,
  TD, Awards, OU) used to show literal "Scott" / "Ty" headers. Now they
  show your display name on the left and the comparison player's name on
  the right (matching the top banner). Driven by a `LabelsProvider`
  context wrapping all game routes.
- **Header banner total now matches the Standings total.** Both views
  share `computeScoredRows()` from `lib/leaderboard-scoring.ts` — same
  field-wide CY projection, same award projection, same OU projection.
  No more "62 vs 84 depending on which page you're on".
- **Stats updater no longer times out.** Parallelized HR + CY player
  lookups (12-way concurrency) so 30+ MLB API calls finish well inside
  the function budget. `maxDuration` raised to 600s for headroom.

---

## v1.0.0 — Bugs + multi-season support

**Date:** 2026-04-29

Hardening pass before production deploy.

### Bug fixes

- **Header text glitch.** "2026 Season" had `·` escape sequences leaking
  through as literal text. Cleaned up.
- **Comparison toggle wasn't refreshing game tabs.** Added a `key` on the
  rendered tab container so changing the comparison player forcibly remounts
  the game component (defensive fix against any stale memoization).
- **Empty leaderboard.** Standings now shows projected points (CY votes /
  award results / O/U projected wins) alongside actual scores. Totals get a
  `~` prefix when projections are involved.
- **Comparison hint text removed.** "(read-only on the comparison side)" was
  confusing — gone.
- **Removed meta-account players** "Talkin' Baseball" and "Jomboy Media"
  from the players list. They were never real draft participants. The four
  show-host players (Trevor, Jake, Jomboy, Chris Rose) remain.

### New: multi-season support

- Schema: `player_picks` now keyed on `(player_id, season)`. Existing rows
  backfilled to season 2026.
- New `app_settings.current_season` (singleton).
- Season selector in the user bar — dropdown lets you view any past season.
  Editing is auto-disabled when viewing a past season; a `READ-ONLY` badge
  appears.
- Stats updater (`/api/update-stats`) now scopes to the current season —
  past seasons stay frozen.

### Polish

- **FA + TD round renumbering at synthesize-time.** When comparing against
  a show host, their FA picks (rounds 1-8 from their own draft) used to
  collide visually with Scott + Ty's snake-draft rounds (1-32). The
  synthesize layer now shifts comparison rounds when they collide so picks
  display cleanly without changing the underlying data.

### Season rollover (manual)

Once awards are out and the season is final, rollover is one SQL call:
```sql
update app_settings set current_season = current_season + 1 where id = 1;
```
The next reload will read empty picks for everyone in the new season; the
prior year's picks remain accessible via the season dropdown.

---

## v0.9.0 — YouTube comments feed (Phase 4)

**Date:** 2026-04-29

Each game tab now has a **Talkin' Baseball Discussion** section under it:
the source episode link with thumbnail at top, followed by the most-liked
top-level comments from that video. Comments by the show hosts (matched
by display name) get a gold "SHOW" badge.

### What changed

- New `api/youtube-comments.ts` Vercel Function. Reads `games_config.source_video_ids`,
  hits the YouTube Data API v3, upserts top-level comments into the
  `youtube_comments` table tagged with the game key. Hosts are detected by
  matching display name against a known-host list and tagged with their handle.
- New `CommentsFeed` React component that loads comments for the current game
  tab, renders them with host highlighting and like counts. YouTube's HTML is
  rendered as-is (their sanitized output preserves emoji and links).
- Added a daily cron at 14:00 UTC to refresh comments — `/api/youtube-comments`
  in `vercel.json`.
- Seeded `games_config.source_video_ids` for fa, cy, pu, hr, ou, ps using the
  episode IDs we already pulled transcripts from. (`td` and `aw` are blank
  until those episodes happen.)

### To turn it on

1. **Get a YouTube Data API v3 key** at
   https://console.cloud.google.com/apis/credentials → Create credentials →
   API key. Restrict to **YouTube Data API v3**. (Free tier: 10 000 units/day,
   each commentThreads call is 1 unit, so plenty.)
2. Add to `.env.local` for local dev: `YOUTUBE_API_KEY=...`
3. Add to Vercel: `vercel env add YOUTUBE_API_KEY production` (and `preview`).
4. Trigger a first fetch: `curl https://your-vercel-url/api/youtube-comments`
   (or open it in a browser). The cron will keep it fresh thereafter.

### Behavior notes

- Each game tab shows up to 25 top comments by like count.
- The video link at the top opens YouTube in a new tab (no embed — keeps the
  app fast and avoids an extra iframe per tab).
- If no comments are loaded yet, the feed shows a helpful "run the endpoint"
  message instead of erroring.

### Initial backfill (done)

937 comments across the 6 games with source videos (cy, fa, hr, ou, ps, pu)
were imported via a one-time `upsert_youtube_comments(jsonb)` SECURITY
DEFINER function. Comments per game:
- ou: 470 (5 episodes)
- fa, hr, ps, pu: 100 each
- cy: 67 (smaller comment thread)

The cron will keep them fresh going forward.

### Auth note

The `upsert_youtube_comments` SECURITY DEFINER function was needed because
the YouTube import script couldn't get a service-role key locally. It's
locked down to the `authenticated` and `service_role` Postgres roles only —
public/anon callers can't invoke it. The Vercel cron uses the service role
directly via `SUPABASE_SERVICE_ROLE_KEY`, so the function isn't strictly
required at runtime — it just makes one-off backfills easy.

---

## v0.8.0 — Talkin' Baseball brand pass (Phase 3)

**Date:** 2026-04-29

Repainted the app to feel like the show — deep TB navy field, cream text,
warm vintage gold, crossed-bats logo, condensed display type for headlines.

### What changed

- **Color palette swap.** Background moved from cool slate `#0f172a` to TB
  deep navy `#0c1a2c`. Text from cool white to cream `#f5ede0`. Gold accents
  shifted from neon `#fbbf24` to a warmer vintage `#e8b54a`. Game accent
  colors retuned to match (slightly desaturated, warmer tones).
- **Typography.** Imported Anton + Inter. New `brand-display` class for
  headlines and big score numbers (chunky condensed sans, very TB merch).
  Body text now Inter.
- **Crossed-bats SVG mark** in the header, sign-in screen, and loading
  screens — replacing the generic ⚾ emoji.
- **Header label fix.** Score panel labels are now dynamic — show the
  current user's display name on the left and the comparison player's name
  on the right (was hardcoded SCOTT/TY).
- **Page title** now "Draft Room — A Talkin' Baseball companion".

---

## v0.7.0 — Stats updater rewrite (Phase 2.5)

**Date:** 2026-04-29

The daily stats job now writes to the new per-player `player_picks` rows
instead of the legacy single shared `draft_room` row. Scott + Ty's WAR /
Cy Young votes / HR totals / O/U wins / projected wins / live odds will
auto-update again. Show host picks (Trevor, Jake, Jomboy, Chris Rose) get
the same treatment — their stats refresh too.

### What changed

- **`api/update-stats.ts` rewritten end-to-end.** It now:
  1. Loads every row in `player_picks` (RLS bypassed via service role).
  2. Collects unique HR + CY pitcher names across ALL players, calls the MLB
     API once per name (no duplicated calls).
  3. Fetches standings, projected wins, position-unit WAR, and award/CY odds
     concurrently from MLB / FanGraphs / The Odds API.
  4. For each player row, applies all relevant updates in memory.
  5. Saves each updated row back to `player_picks`.
- Switched from Edge runtime → Node.js (per Vercel's current guidance).
- PU lookups now accept either a full team name (legacy Scott + Ty shape) or
  a 3-letter abbreviation (LLM-parsed show host shape).
- The "Update Stats" button in the header now reloads every player's picks
  after the job completes (so the leaderboard re-ranks immediately).
- The cron schedule (`0 6 * * *` daily) is unchanged — it'll run nightly
  in production once deployed.

### Things to verify after deploy

- Click **Update Stats** in the header. Watch for a successful response
  with the per-step counters (`HR lookups: N/M`, `Players saved: N/M`).
- Confirm Scott's HR slot for Ohtani updates with current HR count.
- Confirm Trevor's Cy Young pitchers now show ERA/W/L/K/IP stats in the
  CY tab when comparing against him.

---

## v0.6.0 — New game: Postseason picks

**Date:** 2026-04-29

Added an 8th game type — **Postseason** — covering division winners (6),
wild cards (3 per league), pennant winners, and the World Series champion.
Schema, types, parser, UI, and seeded show picks all in.

### What changed

- New `ps` game key added to `games_config` (alongside fa/cy/pu/hr/td/aw/ou).
- New `PSPicks` type added to `UserAppData`.
- New `Postseason.tsx` game component with side-by-side picker + comparison.
- Parser script handles 'ps' as a new game-type prompt.
- Show picks ingested for Trevor and Jake from the 2026 opening day episode:
  - Trevor: NYY/DET/SEA/NYM/MIL/LAD divisions, TOR/BOS/HOU + PHI/CHC/SDP wild
    cards, DET/LAD pennants, **LAD** World Series.
  - Jake:   NYY/DET/TEX/PHI/MIL/LAD divisions, SEA/BAL/KCR + CHC/ATL/SFG wild
    cards, SEA/PHI pennants, **SEA** World Series.

### Known gaps

- Leaderboard scoring doesn't yet count postseason picks. Will plug in once
  results start coming in.
- The opening day episode does not appear to have done formal MVP/RoY/CY/MGR
  award picks (just postseason). Those'd need a dedicated episode.

---

## v0.5.0 — Most show picks ingested (Phase 5 batch)

**Date:** 2026-04-29

Pulled and parsed 8 episode transcripts via `yt-dlp` + `claude -p` and inserted
the resulting picks. Show host data now exists for FA, CY, PU, HR, and OU
games. Trade Deadline + Awards remain (those episodes haven't happened yet).

### Coverage

| Host | FA | CY | PU | HR | OU |
|------|----|----|----|----|----|
| Trevor Plouffe | 8 | 5 | 4 | 9 | 19/30 |
| Jake Storiale  | 8 | 5 | 4 | 9 | 19/30 |
| Chris Rose     | 8 | — | — | — | — |
| Jimmy O'Brien  | — | — | 4 | — | — |

OU is split across 5 transcript episodes; the merged result covers 19 of 30
teams. Missing teams: ATL, BAL, BOS, CHC, DET, HOU, MIL, NYM, NYY, SDP, SFG —
either those episodes aren't out yet, or the LLM missed them.

The show participation pattern matches the user's note: Trevor and Jake are
full-time hosts on every game; others guest on specific episodes (Chris Rose
on FA, Jomboy on PU). Eno Sarris was the Cy Young guest but isn't ingested
since he's not on the standing host roster.

---

## v0.4.0 — First show picks ingested (Phase 5 start)

**Date:** 2026-04-29

Built the LLM-assisted transcript parser and ingested the 2026 Cy Young
draft picks for **Trevor Plouffe** and **Jake Storiale (Jolly Olive)** —
5 picks each (the episode only did 5 rounds since 3 people draft together
and discussion is long-form).

### What changed

- New script: `scripts/parse-transcript.mjs` — sends a transcript to
  `claude -p` with a per-game prompt and writes structured picks JSON.
  Handles all 7 game types via a switch (cy/fa/pu/hr/td/aw/ou).
- New script: `scripts/insert-show-picks.mjs` — takes a picks JSON and
  upserts into `player_picks` for the matching show host handles.
  Idempotent and merges per-game (other games stay untouched).
- Trevor's `cy` picks now in DB: Skubal, Webb, McLean (rookie), Fried, Joe Ryan.
- Jake's `cy` picks now in DB: Crochet, C. Sanchez, Gore, F. Valdez, Strider.
- Eno Sarris (guest analyst on this episode) is intentionally **not** ingested
  — he's not one of the standing show hosts.

### Workflow for future episodes

```sh
# 1. Pull transcript
yt-dlp --write-auto-sub --skip-download --sub-lang en --sub-format vtt \
  -o "transcripts/%(id)s.%(ext)s" "<youtube-url>"

# 2. Clean it
node scripts/clean-vtt.mjs transcripts/<id>.en.vtt transcripts/<game>-2026.txt

# 3. Parse with the LLM
node scripts/parse-transcript.mjs \
  transcripts/<game>-2026.txt <game-key> transcripts/<game>-2026-picks.json

# 4. Insert
SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
  node scripts/insert-show-picks.mjs transcripts/<game>-2026-picks.json
```

(Step 4 can also be done via the Supabase MCP with raw SQL.)

---

## v0.3.0 — Multi-user picks live (Phase 2)

**Date:** 2026-04-29

The app now reads and writes from per-user `player_picks` rows. The legacy
shared `draft_room` row is no longer the source of truth for the UI.

### What changed

- **Per-user picks load and save.** Sign in, your edits go to your own row.
- **Comparison player picker** — a "vs [name] ▾" dropdown at the top of every
  tab. Scott + Ty default to comparing each other (preserves existing
  experience). New users default to comparing against Talkin' Baseball.
- **Multi-player Standings** — the leaderboard now shows all 8 players
  (Scott, Ty, plus 6 show hosts) ranked by total points. Click any other
  player's row to make them your comparison.
- **Allowlist gate removed.** Anyone who signs up gets a working draft room.

### How the synthesizing adapter works

To avoid rewriting every game component (FreeAgent, CyYoung, PositionUnit,
HRTeam, TradeDeadline, Awards, WinOU), Phase 2 synthesizes a legacy
`AppData` shape from your picks + the comparison player's picks at the
top level. Game components receive that synthesized shape unchanged.
On save, only your portion is extracted and persisted.

Trade-off: labels in the existing UI still say "SCOTT" / "TY" hard-coded.
For Scott + Ty those are correct. For other users, "SCOTT" means them and
"TY" means whoever they're comparing to. A label-pass polish is queued.

### Known gaps

- Show hosts (Jomboy, Jolly, Chris Rose, Trevor Plouffe, etc.) have **empty
  picks** — Phase 5 brings show pick ingestion from YouTube transcripts.
- The daily stats updater still writes to the legacy `draft_room` row, not
  per-user picks. Scott + Ty's WAR / Cy Young votes / HR totals / O/U wins
  are frozen at the moment of migration. Phase 2.5 will rewrite the updater
  to write to `player_picks`.
- Edits made to the comparison side of any game won't save (they get
  discarded on the next re-render).

---

## v0.2.0 — Multi-user foundation (Phase 1)

**Date:** 2026-04-29

This is the foundation for turning Draft Room from a private Scott-and-Ty
two-player app into a multi-user app where anyone can sign up, make their own
picks, and compare against the **Talkin' Baseball** show hosts.

Phase 1 ships the auth system, the new database schema, and the migration
script. Game UIs still render the legacy two-player view post sign-in (Phase 2
will rewrite them to be per-user).

### What changed

- **Sign-in required.** The app now sits behind authentication. Three sign-in
  methods are supported:
  - Magic link (passwordless email)
  - Email + password
  - Continue with Google (requires Google OAuth provider enabled in Supabase)
- **New database tables** (additive — `draft_room` row preserved as backup):
  - `players` — one row per person who can have picks (auth users + show hosts)
  - `player_picks` — per-player picks JSONB (replaces the single shared row)
  - `games_config` — per-game metadata + source video IDs for the future
    YouTube comments feed
  - `youtube_comments` — cache of host comments pulled from YouTube videos
- **Row-level security** — users see their own picks, plus any other users
  who've marked themselves public, plus all show hosts.
- **Public/private toggle** ready (field exists on `players`; UI surfaces in
  Phase 2).
- **Show hosts pre-seeded** as accounts: Talkin' Baseball, Jomboy, Jolly
  Olive, Chris Rose, Trevor Plouffe, Jomboy Media.
- **Migration script** at `scripts/migrate-to-multiuser.mjs` that:
  1. Reads the existing `draft_room` JSONB row
  2. Splits Scott + Ty's combined picks into per-user rows
  3. Creates Supabase auth users for both
  4. Creates show host player rows
  5. Sends magic-link claim emails to both Scott and Ty

### What did **not** change

- Existing data is untouched. The `draft_room` row stays in place as a
  rollback backup.
- The post-sign-in experience still uses the legacy single-row Scott + Ty
  view. Per-user game UIs ship in Phase 2.

### Migration status

**Applied via Supabase MCP on 2026-04-29.** Schema is live, six show host
players seeded, and Scott + Ty's existing picks are split into per-user
`player_picks` rows linked to their existing auth user IDs (`sendscott@gmail.com`
and `tyshurtliff@gmail.com`, which already existed in the shared Supabase
project from other apps). The `migrate-to-multiuser.mjs` script is kept in the
repo for future reference but was **not** needed.

The legacy `draft_room` row is preserved and remains the source of truth for
the post-sign-in UI until Phase 2 ships.

### Phase 1 stopgap (important)

Only Scott + Ty's user IDs can see the legacy editor. Anyone else who signs up
lands on a "your draft is being set up" placeholder. This is to prevent
strangers from overwriting the shared `draft_room` row. Lifted in Phase 2.

### Optional next steps

- Enable Google as an auth provider in Supabase → Authentication → Providers
  to make the "Continue with Google" button live.

### Coming next

- **Phase 2:** Per-user game UIs (your picks vs. show vs. friends, with
  side-by-side comparisons).
- **Phase 3:** Talkin' Baseball brand rebrand (colors, logo, typography).
- **Phase 4:** YouTube comments feed per game (host-only, auto-pulled).
- **Phase 5:** Show picks ingestion via YouTube transcript pipeline
  (`yt-dlp` + cleaning script already in place — see `scripts/clean-vtt.mjs`
  and `transcripts/`).
