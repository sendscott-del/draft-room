# Draft Room 2026 — Claude Code Migration Instructions

## Project Overview
This is a baseball draft game tracker for Scott and Ty (father and son). They play 7 season-long prediction games tracking the 2026 MLB season. The app currently exists as a single vanilla JS HTML file hosted on GitHub Pages with data persisted via a Google Apps Script endpoint.

## Goal
Migrate to a proper React + Supabase + Vercel stack so the app is easier to maintain, update stats, and extend.

---

## Current Stack
- **Frontend**: Single `index.html` file with vanilla JS (no framework)
- **Hosting**: GitHub Pages (`sendscott-del.github.io/draft-room`)
- **Database**: Google Sheets via Apps Script endpoint
- **Apps Script URL**: `https://script.google.com/macros/s/AKfycbyLAypFMaTkx_tCEAHjo517khUZ8g7Zas_puueQZe5n0w-0d9Wga6o2qNgfx8QX9-ERSQ/exec`

## Target Stack
- **Frontend**: React (Vite) with TypeScript
- **Hosting**: Vercel
- **Database**: Supabase (Postgres)
- **Repo**: GitHub (`sendscott-del/draft-room` — currently exists, will need restructuring)

---

## Step 1: Initialize the Project

```bash
npm create vite@latest draft-room -- --template react-ts
cd draft-room
npm install
npm install @supabase/supabase-js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Set up Tailwind in `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Step 2: Supabase Schema

Create ONE table called `draft_room` with a single row that stores all game data as JSON. This matches the current architecture (one JSON blob) and keeps things simple.

```sql
create table draft_room (
  id integer primary key default 1,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Insert the initial empty row
insert into draft_room (id, data) values (1, '{}');

-- Enable RLS but allow public read/write (it's a private family app)
alter table draft_room enable row level security;

create policy "Allow public read" on draft_room for select using (true);
create policy "Allow public write" on draft_room for update using (true);
```

---

## Step 3: Supabase Client

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function loadData(): Promise<any> {
  const { data, error } = await supabase
    .from('draft_room')
    .select('data')
    .eq('id', 1)
    .single()
  if (error) throw error
  return data.data
}

export async function saveData(gameData: any): Promise<void> {
  const { error } = await supabase
    .from('draft_room')
    .update({ data: gameData, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw error
}
```

---

## Step 4: Data Types

Create `src/types.ts` with all game data types:

```typescript
export interface FAPick {
  round: number
  owner: 'Scott' | 'Ty'
  player: string
  team: string
  years: string
  newTeam: boolean
  award: boolean
  asg: boolean
  actual: string // e.g. "5yr LAD"
}

export interface CYPick {
  round: number
  pitcher: string
  lg: 'AL' | 'NL'
  odds: string
  rookie: boolean
  votes: number
}

export interface PUPick {
  r: number
  team: string
  unit: 'INF+C' | 'OF' | 'SP' | 'RP'
  war: number
}

export interface HRSlot {
  p: string  // player name
  t: string  // team abbr
  hr: number
}

export interface TDPick {
  round: number
  owner: 'Scott' | 'Ty'
  player: string
  team: string
  traded: boolean
  asg: boolean
  award: boolean
}

export type AwardResult = 'none' | 'winner' | 'finalist' | 'top10'

export interface AwardPicks {
  alMVP: string; nlMVP: string; alROY: string; nlROY: string
  alCY: string;  nlCY: string;  alMGR: string; nlMGR: string
  alMVPR: AwardResult; nlMVPR: AwardResult
  alROYR: AwardResult; nlROYR: AwardResult
  alCYR: AwardResult;  nlCYR: AwardResult
  alMGRR: AwardResult; nlMGRR: AwardResult
}

export interface OUPick {
  pick: 'over' | 'under' | ''
  actual: string
}

export interface AppData {
  fa: FAPick[]
  cy: { Scott: CYPick[]; Ty: CYPick[] }
  pu: { Scott: PUPick[]; Ty: PUPick[] }
  hr: { Scott: Record<string, HRSlot>; Ty: Record<string, HRSlot> }
  td: TDPick[]
  aw: { Scott: AwardPicks; Ty: AwardPicks }
  ou: { Scott: Record<string, OUPick>; Ty: Record<string, OUPick> }
}
```

---

## Step 5: Default Data

Create `src/data/defaults.ts` containing all the pre-populated picks. Pull these directly from the current `index.html` file — they are defined in the `DEFAULT` variable starting around line 100. Copy them verbatim but convert to TypeScript. Key data:

**Free Agent picks** (32 total, snake draft):
- R1 Scott: Kyle Tucker, LAD, 10yr, newTeam, award, actual:"4yr LAD"
- R2 Ty: Kyle Schwarber, PHI, 5yr, re-sign, award, actual:"5yr PHI"
- R3 Scott: Cody Bellinger, NYY, 6yr, newTeam, award, actual:"5yr NYY"
- R4 Ty: Pete Alonso, NYM, 6yr, re-sign, asg, actual:"5yr BAL"
- R5 Scott: Alex Bregman, PHI, 5yr, newTeam, award, actual:"5yr CHC"
- R6 Ty: Dylan Cease, SFG, 8yr, newTeam, actual:"7yr TOR"
- R7 Scott: Edwin Diaz, LAD, 5yr, newTeam, asg, actual:"3yr LAD"
- R8 Ty: Framber Valdez, TOR, 5yr, newTeam, actual:"3yr DET"
- R9 Scott: Justin Verlander, HOU, 1yr, re-sign, award, actual:"1yr DET"
- R10 Ty: Zac Gallen, ATL, 2yr, newTeam, actual:"1yr ARZ"
- R11 Scott: Ryan O'Hearn, LAA, 4yr, newTeam, asg, actual:"2yr PIT"
- R12 Ty: Devin Williams, LAA, newTeam, asg, actual:"3yr NYM"
- R13 Scott: Robert Suarez, NYM, 2yr, newTeam, asg, actual:"3yr ATL"
- R14 Ty: Bo Bichette, TBR, 8yr, newTeam, actual:"3yr NYM"
- R15 Scott: Munetaka Murakami, BOS, 5yr, newTeam, actual:"2yr CWS"
- R16 Ty: Ranger Suarez, BOS, 6yr, newTeam, actual:"5yr BOS"
- R17 Scott: Eugenio Suarez, ARI, 2yr, newTeam, actual:"1yr CIN"
- R18 Ty: JT Realmuto, BOS, 2yr, newTeam, actual:"3yr PHI"
- R19 Scott: Chris Bassitt, TOR, 1yr, re-sign, actual:"1yr BAL"
- R20 Ty: Tatsuya Imai, CHC, 5yr, newTeam, actual:"3yr HOU"
- R21 Scott: Lucas Giolito, BOS, 3yr, re-sign, actual:""
- R22 Ty: Merrill Kelly, DET, 1yr, newTeam, actual:"2yr ARZ"
- R23 Scott: Jorge Polanco, SEA, 3yr, re-sign, actual:"2yr NYM"
- R24 Ty: Kazuma Okamoto, SEA, 4yr, newTeam, actual:""
- R25 Scott: Harrison Bader, PHI, 2yr, re-sign, actual:"2yr SFG"
- R26 Ty: (empty)
- R27 Scott: Michael Soroka, KCR, 2yr, newTeam, actual:"1yr ARZ"
- R28 Ty: Emilio Pagan, CIN, 2yr, re-sign, actual:"2yr CIN"
- R29 Scott: Luis Arraez, MIA, 3yr, re-sign, actual:"1yr SFG"
- R30 Ty: Ha-Seong Kim, PIT, 3yr, newTeam, actual:"1yr ATL"
- R31 Scott: Marcell Ozuna, TEX, 2yr, newTeam, actual:"1yr PIT"
- R32 Ty: Tyler Rogers, OAK, 1yr, newTeam, actual:"3yr TOR"

**Cy Young picks**: See index.html DEFAULT.cy — 10 pitchers each, Scott has AL heavy (Skubal, Crochet, DeGrom, Ragans, Fried, Eovaldi), Ty has NL heavy (Skenes, Yamamoto, Webb, Sale, Ohtani, Gore)

**Position Units**: See index.html DEFAULT.pu — 12 teams each (Ty: Orioles INF+C, Yankees OF, Red Sox SP, Padres RP, etc. Scott: Mets INF+C, Dodgers OF, Tigers SP, Phillies RP, etc.)

**HR Team**: See index.html DEFAULT.hr — 9 positions each

**O/U Lines** (2026 current lines):
LAD:102.5, NYY:91.5, TOR:91.5, PHI:89.5, NYM:88.5, ATL:87.5, HOU:85.5, MIL:84.5, BAL:84.5, SEA:82.5, BOS:82.5, SDP:83.5, DET:81.5, CHC:81.5, KCR:80.5, ARI:79.5, SFG:79.5, STL:78.5, CLE:78.5, TEX:78.5, TBR:76.5, OAK:75.5, PIT:74.5, MIN:73.5, MIA:72.5, LAA:70.5, WSN:67.5, CWS:66.5, COL:52.5

---

## Step 6: Scoring Logic

Create `src/lib/scoring.ts`. Port the scoring functions from `index.html` exactly:

### Free Agent Scoring
```typescript
// Per pick:
// - Team correct + new team: 10pts
// - Team correct + re-sign: 5pts
// - Contract years match (regardless of team): 5pts
// - Team correct + (award winner OR All-Star): 5pts
// - Team correct + round > 24: 5pts
// - Team correct + round >= 26 + actual team not seen yet in rounds 26-32: 5pts (unused team bonus)
// actual field format: "5yr LAD" — parse years and team from this
```

### Cy Young
```typescript
// Points = Number(pick.votes) for each pitcher
// Total is sum of all votes for that player's pitchers
```

### Position Unit
```typescript
// Points = sum of pick.war for all 12 units
```

### HR Team
```typescript
// Points = sum of slot.hr for all 9 positions
```

### Trade Deadline
```typescript
// Per pick (if player filled in):
// - pick.team filled: 10pts
// - pick.traded: 5pts
// - pick.asg OR pick.award: 5pts
```

### Awards
```typescript
const PTS = { winner: 25, finalist: 10, top10: 5, none: 0 }
// Sum across alMVPR, nlMVPR, alROYR, nlROYR, alCYR, nlCYR, alMGRR, nlMGRR
```

### Win O/U
```typescript
// 3pts per correct pick (pick === 'over' && actual > line, or pick === 'under' && actual < line)
```

---

## Step 7: Lock Logic

Create `src/lib/locks.ts`:

```typescript
const LOCK_DATE     = new Date("2026-03-27T00:05:00Z") // Mar 26 7:05pm CT
const DEADLINE_DATE = new Date("2026-08-03T22:00:00Z") // Aug 3 6pm ET
const SEASON_END    = new Date("2026-09-28T03:59:59Z") // Sep 27 midnight ET

export function isLocked(game: string): boolean {
  const now = new Date()
  const seasonStarted = now >= LOCK_DATE
  // FA, CY, PU, HR: locked permanently (draft complete)
  if (['fa', 'cy', 'pu', 'hr'].includes(game)) return true
  // TD: never locked (mid-season entries)
  if (game === 'td') return false
  // AW, OU picks: locked when season starts
  if (['aw', 'ou'].includes(game)) return seasonStarted
  return false
}

export function getCountdownState() {
  const now = new Date()
  if (now < LOCK_DATE)     return { label: 'Picks Lock In',     target: LOCK_DATE,     phase: 'preseason' }
  if (now < DEADLINE_DATE) return { label: 'Trade Deadline In', target: DEADLINE_DATE, phase: 'season' }
  if (now < SEASON_END)    return { label: 'Season Ends In',    target: SEASON_END,    phase: 'deadline' }
  return { label: 'Season Complete', target: null, phase: 'done' }
}
```

---

## Step 8: Component Structure

```
src/
  components/
    Header.tsx          — sticky header with scores, sync dot, countdown
    Nav.tsx             — tab navigation
    Leaderboard.tsx     — standings with FINAL/INTERIM badges
    games/
      FreeAgent.tsx     — FA picks with per-pick scoring breakdown
      CyYoung.tsx       — CY picks with vote entry
      PositionUnit.tsx  — PU picks with WAR entry
      HRTeam.tsx        — HR team with HR entry
      TradeDeadline.tsx — TD picks (mid-season)
      Awards.tsx        — MVP/ROY/CY/MGR picks with result dropdowns
      WinOU.tsx         — O/U picks with actual win entry
      Rules.tsx         — scoring rules reference
    ui/
      Card.tsx
      Toggle.tsx
      LockBanner.tsx
      Pill.tsx
      SyncDot.tsx
      Countdown.tsx
  lib/
    supabase.ts
    scoring.ts
    locks.ts
  data/
    defaults.ts
    constants.ts        — TEAMS, POS, PLAYERS, GMETA, OUL
  types.ts
  App.tsx
  main.tsx
```

---

## Step 9: App State & Auto-Save

In `App.tsx`, use a debounced auto-save pattern:

```typescript
const [data, setData] = useState<AppData>(DEFAULT_DATA)
const [syncStatus, setSyncStatus] = useState<'loading'|'saved'|'saving'|'error'>('loading')
const saveTimerRef = useRef<ReturnType<typeof setTimeout>>()

// Load on mount
useEffect(() => {
  loadData().then(d => {
    if (d && d.fa) setData(merge(DEFAULT_DATA, d))
    setSyncStatus('saved')
  }).catch(() => setSyncStatus('error'))
}, [])

// Auto-save on data change (debounced 800ms)
useEffect(() => {
  if (syncStatus === 'loading') return
  setSyncStatus('saving')
  clearTimeout(saveTimerRef.current)
  saveTimerRef.current = setTimeout(() => {
    saveData(data)
      .then(() => setSyncStatus('saved'))
      .catch(() => setSyncStatus('error'))
  }, 800)
}, [data])
```

Use a `merge` helper that deep-merges saved data onto defaults so new fields always get default values when loading old saves.

---

## Step 10: Game Status (FINAL vs INTERIM)

In `src/data/constants.ts`, define game statuses. Update these as the season progresses:

```typescript
export const GAME_STATUS: Record<string, 'final' | 'interim'> = {
  fa: 'final',    // Free agency complete
  cy: 'interim',  // Updates at end of season
  pu: 'interim',  // Updates throughout season
  hr: 'interim',  // Updates throughout season
  td: 'interim',  // Updates after trade deadline
  aw: 'interim',  // Updates at end of season
  ou: 'interim',  // Updates at end of season
}
```

---

## Step 11: Vercel Deployment

1. Push the repo to GitHub (`sendscott-del/draft-room`)
2. Go to vercel.com → Import project → select the repo
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-deploys on every push to main

Add `vercel.json` for SPA routing:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

---

## Step 12: Migrate Existing Data

After the app is deployed, run this one-time migration to move data from the Google Apps Script into Supabase:

```typescript
// Run once in browser console or as a script
const appsScriptUrl = "https://script.google.com/macros/s/AKfycbyLAypFMaTkx_tCEAHjo517khUZ8g7Zas_puueQZe5n0w-0d9Wga6o2qNgfx8QX9-ERSQ/exec"
const existingData = await fetch(appsScriptUrl).then(r => r.json())
// Then save to Supabase via the new saveData() function
await saveData(existingData)
```

---

## Design Reference

The app uses a dark navy theme. Replicate these exact colors:

```typescript
export const COLORS = {
  bg: '#0f172a',
  cardBg: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.09)',
  text: '#f1f5f9',
  muted: '#64748b',
  muted2: '#94a3b8',
  green: '#22c55e',   // Free Agent
  blue: '#3b82f6',    // Cy Young
  purple: '#a855f7',  // Position Unit
  red: '#ef4444',     // HR Team
  amber: '#f59e0b',   // Trade Deadline
  cyan: '#06b6d4',    // Awards
  pink: '#ec4899',    // Win O/U
  gold: '#fbbf24',    // Leader highlight
}
```

Font: Georgia serif for body, monospace for scores/numbers.

---

## Key Behaviors to Preserve

1. **Per-pick scoring display** — each pick card shows its point total and breakdown (e.g. "New team +10 · Award/ASG +5 · Contract +5")
2. **Green/red card borders** — green if pick scored, red if pick scored 0, neutral if no result yet
3. **Sync dot** — yellow while saving, green when saved, red on error
4. **Lock banners** — different message per game ("Draft complete" vs "Season has started")
5. **FINAL/INTERIM badges** — shown on each game card in standings
6. **Multi-phase countdown** — preseason → trade deadline → season end → complete
7. **O/U over/under buttons** — toggle style, green for over, blue for under, deselects on second tap
8. **HR conflict detection** — red warning if same team appears in both Scott and Ty's HR lineup
9. **Auto-save debounce** — 800ms after last change
10. **Data merge on load** — new fields always get defaults even when loading old saves

---

## Notes for Claude Code

- Keep the single-row Supabase approach — it's simple and works perfectly for this use case
- The app has no auth — it's a private family app, both users share the same data
- WAR, HR totals, CY votes, and actual win totals are the stats that get updated throughout the season — make these easy to edit even after picks are locked
- When Scott says "update the stats", he means updating the `war`, `hr`, `votes`, and `ou[player][team].actual` fields — not the picks themselves
- The Google Apps Script can be retired once Supabase is confirmed working
