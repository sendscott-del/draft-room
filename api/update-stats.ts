import { createClient } from '@supabase/supabase-js'

// Vercel Function — defaults to Node.js runtime (Fluid Compute) for richer
// stdlib support and matching pricing/regions to Edge.

const SEASON = 2026

const MLB_TEAM_MAP: Record<number, string> = {
  109: 'ARI', 144: 'ATL', 110: 'BAL', 111: 'BOS', 112: 'CHC',
  145: 'CWS', 113: 'CIN', 114: 'CLE', 115: 'COL', 116: 'DET',
  117: 'HOU', 118: 'KCR', 108: 'LAA', 119: 'LAD', 146: 'MIA',
  158: 'MIL', 142: 'MIN', 121: 'NYM', 147: 'NYY', 133: 'OAK',
  143: 'PHI', 134: 'PIT', 135: 'SDP', 136: 'SEA', 137: 'SFG',
  138: 'STL', 139: 'TBR', 140: 'TEX', 141: 'TOR', 120: 'WSN',
}

const PLAYER_SEARCH_NAMES: Record<string, string> = {
  'Vladdy Jr': 'Vladimir Guerrero Jr',
  'Bobby Witt Jr': 'Bobby Witt Jr',
  'Junior Caminero': 'Junior Caminero',
  'Cristopher Sanchez': 'Cristopher Sanchez',
  'Christopher Sanchez': 'Cristopher Sanchez',
}

// Translate either a full team name (legacy Scott+Ty PU shape) OR a 3-letter
// abbreviation (LLM-parsed show host shape) into our canonical 3-letter code.
const PU_TEAM_MAP: Record<string, string> = {
  'Mets': 'NYM', 'Dodgers': 'LAD', 'Tigers': 'DET', 'Phillies': 'PHI',
  'Giants': 'SFG', 'Athletics': 'OAK', 'Rangers': 'TEX', 'Guardians': 'CLE',
  'Cubs': 'CHC', 'Diamondbacks': 'ARI', 'Pirates': 'PIT', 'White Sox': 'CHW',
  'Orioles': 'BAL', 'Yankees': 'NYY', 'Red Sox': 'BOS', 'Padres': 'SDP',
  'Blue Jays': 'TOR', 'Braves': 'ATL', 'Mariners': 'SEA', 'Brewers': 'MIL',
  'Royals': 'KCR', 'Marlins': 'MIA', 'Reds': 'CIN', 'Rays': 'TBR',
  'Astros': 'HOU', 'Cardinals': 'STL', 'Twins': 'MIN', 'Nationals': 'WSN',
  'Angels': 'LAA', 'Rockies': 'COL',
}

const FG_TEAM_MAP: Record<string, string> = {
  NYY: 'NYY', NYM: 'NYM', LAD: 'LAD', LAA: 'LAA', CHC: 'CHC',
  CHW: 'CWS', CWS: 'CWS', SFG: 'SFG', SF: 'SFG', SDP: 'SDP',
  SD: 'SDP', TBR: 'TBR', TB: 'TBR', KCR: 'KCR', KC: 'KCR',
  WSN: 'WSN', WSH: 'WSN', ARI: 'ARI', ATL: 'ATL', BAL: 'BAL',
  BOS: 'BOS', CIN: 'CIN', CLE: 'CLE', COL: 'COL', DET: 'DET',
  HOU: 'HOU', MIA: 'MIA', MIL: 'MIL', MIN: 'MIN', OAK: 'OAK',
  PHI: 'PHI', PIT: 'PIT', SEA: 'SEA', STL: 'STL', TEX: 'TEX',
  TOR: 'TOR',
}

const AWARD_TITLE_MAP: Record<string, string> = {
  'al mvp': 'alMVP', 'nl mvp': 'nlMVP',
  'al rookie of the year': 'alROY', 'nl rookie of the year': 'nlROY',
  'al cy young': 'alCY', 'nl cy young': 'nlCY',
  'al manager of the year': 'alMGR', 'nl manager of the year': 'nlMGR',
  'american league mvp': 'alMVP', 'national league mvp': 'nlMVP',
  'american league rookie': 'alROY', 'national league rookie': 'nlROY',
  'american league cy young': 'alCY', 'national league cy young': 'nlCY',
}

interface PitcherStats { era: string; w: number; l: number; k: number; ip: string }
interface UnitWAR { team: string; unit: string; war: number }
interface AllAwardOdds { cy: Record<string, string>; awards: Record<string, Record<string, string>> }

// ---- External fetchers (one-shot, shared across all players) ---------------

async function fetchStandings(): Promise<Record<string, number>> {
  const wins: Record<string, number> = {}
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${SEASON}&standingsTypes=regularSeason`
    )
    const data = await res.json()
    for (const record of data.records || []) {
      for (const team of record.teamRecords || []) {
        const abbr = MLB_TEAM_MAP[team.team?.id]
        if (abbr) wins[abbr] = team.wins ?? 0
      }
    }
  } catch (e) { console.error('standings:', e) }
  return wins
}

async function searchPlayer(name: string): Promise<number | null> {
  try {
    const searchName = PLAYER_SEARCH_NAMES[name] || name
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(searchName)}&sportIds=1&active=true`
    )
    const data = await res.json()
    return data.people?.[0]?.id ?? null
  } catch { return null }
}

async function fetchPlayerHR(name: string): Promise<number | null> {
  try {
    const id = await searchPlayer(name)
    if (!id) return null
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season&season=${SEASON}&group=hitting`
    )
    const data = await res.json()
    const splits = data.stats?.[0]?.splits
    if (!splits || splits.length === 0) return 0
    return splits[0].stat?.homeRuns ?? 0
  } catch { return null }
}

async function fetchPitcherStats(name: string): Promise<PitcherStats | null> {
  try {
    const id = await searchPlayer(name)
    if (!id) return null
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season&season=${SEASON}&group=pitching`
    )
    const data = await res.json()
    const splits = data.stats?.[0]?.splits
    if (!splits || splits.length === 0) return { era: '-.--', w: 0, l: 0, k: 0, ip: '0.0' }
    const s = splits[0].stat
    return { era: s?.era ?? '-.--', w: s?.wins ?? 0, l: s?.losses ?? 0, k: s?.strikeOuts ?? 0, ip: s?.inningsPitched ?? '0.0' }
  } catch { return null }
}

async function fetchProjectedWins(): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  try {
    const res = await fetch(`https://www.fangraphs.com/api/playoff-odds/odds?season=${SEASON}`)
    if (res.ok) {
      const data = await res.json()
      for (const team of data) {
        const abbr = FG_TEAM_MAP[team.abbName] || team.abbName
        const expW = team.endData?.ExpW
        if (abbr && expW != null) out[abbr] = Math.round(expW * 10) / 10
      }
    }
  } catch (e) { console.error('projected wins:', e) }
  return out
}

function posToUnit(pos: string): 'INF+C' | 'OF' | null {
  if (!pos) return null
  const parts = pos.split('/')
  const infC = ['C', '1B', '2B', '3B', 'SS']
  const of = ['LF', 'CF', 'RF', 'OF']
  if (parts.some(p => of.includes(p.trim()))) return 'OF'
  if (parts.some(p => infC.includes(p.trim()))) return 'INF+C'
  if (parts.some(p => p.trim() === 'DH')) return 'INF+C'
  return null
}

async function fetchUnitWAR(): Promise<UnitWAR[]> {
  const unitWars: Record<string, Record<string, number>> = {}
  try {
    const batRes = await fetch(
      `https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=bat&lg=all&qual=0&season=${SEASON}&month=0&team=0&pageitems=2000&pagenum=1&ind=0&rost=0&players=0&type=8&postseason=&sortdir=default&sortstat=WAR`
    )
    if (batRes.ok) {
      const batData = await batRes.json()
      for (const p of batData.data || batData || []) {
        const teamAbbr = p.TeamNameAbb || p.Team || ''
        const pos = p.position || p.positionDB || ''
        const war = Number(p.WAR) || 0
        const unit = posToUnit(pos)
        if (!teamAbbr || !unit) continue
        if (!unitWars[teamAbbr]) unitWars[teamAbbr] = {}
        unitWars[teamAbbr][unit] = (unitWars[teamAbbr][unit] || 0) + war
      }
    }
    const pitRes = await fetch(
      `https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=pit&lg=all&qual=0&season=${SEASON}&month=0&team=0&pageitems=2000&pagenum=1&ind=0&rost=0&players=0&type=8&postseason=&sortdir=default&sortstat=WAR`
    )
    if (pitRes.ok) {
      const pitData = await pitRes.json()
      for (const p of pitData.data || pitData || []) {
        const teamAbbr = p.TeamNameAbb || p.Team || ''
        const war = Number(p.WAR) || 0
        const gs = Number(p.GS) || 0
        const g = Number(p.G) || 1
        const unit = gs / g >= 0.5 ? 'SP' : 'RP'
        if (!teamAbbr) continue
        if (!unitWars[teamAbbr]) unitWars[teamAbbr] = {}
        unitWars[teamAbbr][unit] = (unitWars[teamAbbr][unit] || 0) + war
      }
    }
  } catch (e) { console.error('unit WAR:', e) }
  const result: UnitWAR[] = []
  for (const [team, units] of Object.entries(unitWars)) {
    for (const [unit, war] of Object.entries(units)) {
      result.push({ team, unit, war: Math.round(war * 10) / 10 })
    }
  }
  return result
}

async function fetchAllAwardOdds(): Promise<AllAwardOdds> {
  const result: AllAwardOdds = { cy: {}, awards: {} }
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) return result
  try {
    const sportsRes = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`)
    const sports = await sportsRes.json()
    const mlbKeys = sports
      .filter((s: { key?: string; has_outrights?: boolean }) => s.key?.includes('baseball_mlb') && s.has_outrights)
      .map((s: { key: string }) => s.key)

    for (const key of mlbKeys) {
      const oddsRes = await fetch(
        `https://api.the-odds-api.com/v4/sports/${key}/odds?apiKey=${apiKey}&regions=us&markets=outrights&oddsFormat=american`
      )
      if (!oddsRes.ok) continue
      const oddsData = await oddsRes.json()
      for (const event of oddsData) {
        const title = (event.sport_title || '').toLowerCase()
        const outcomes: { name: string; price: number }[] = []
        for (const bookmaker of event.bookmakers || []) {
          for (const market of bookmaker.markets || []) {
            for (const outcome of market.outcomes || []) {
              if (outcome.name && outcome.price != null) {
                outcomes.push({ name: outcome.name, price: outcome.price })
              }
            }
          }
          break
        }
        if (outcomes.length === 0) continue
        const oddsMap: Record<string, string> = {}
        for (const o of outcomes) {
          const prefix = o.price >= 0 ? '+' : ''
          oddsMap[o.name] = `${prefix}${o.price}`
        }
        if (title.includes('cy young')) Object.assign(result.cy, oddsMap)
        for (const [pattern, cat] of Object.entries(AWARD_TITLE_MAP)) {
          if (title.includes(pattern)) {
            result.awards[cat] = { ...(result.awards[cat] || {}), ...oddsMap }
          }
        }
      }
    }
  } catch (e) { console.error('award odds:', e) }
  return result
}

// ---- Per-player updater ----------------------------------------------------

interface PicksRow { player_id: string; data: Record<string, unknown> }

function updateOnePlayer(
  picks: Record<string, unknown>,
  ctx: {
    standings: Record<string, number>
    projWins: Record<string, number>
    hrCounts: Record<string, number>
    cyStats: Record<string, PitcherStats>
    cyOdds: Record<string, string>
    unitWAR: UnitWAR[]
    awardsOdds: Record<string, Record<string, string>>
  }
): Record<string, unknown> {
  const next = { ...picks } as Record<string, unknown>

  // OU: actual wins + projected wins
  if (next.ou && typeof next.ou === 'object') {
    const ou = { ...(next.ou as Record<string, { pick?: string; actual?: string; projected?: number }>) }
    for (const [abbr, w] of Object.entries(ctx.standings)) {
      if (ou[abbr]) ou[abbr] = { ...ou[abbr], actual: String(w) }
    }
    for (const [abbr, p] of Object.entries(ctx.projWins)) {
      if (ou[abbr]) ou[abbr] = { ...ou[abbr], projected: p }
    }
    next.ou = ou
  }

  // HR: each slot's hr count
  if (next.hr && typeof next.hr === 'object') {
    const hr = { ...(next.hr as Record<string, { p?: string; t?: string; hr?: number }>) }
    for (const [pos, slot] of Object.entries(hr)) {
      if (slot?.p && ctx.hrCounts[slot.p] != null) {
        hr[pos] = { ...slot, hr: ctx.hrCounts[slot.p] }
      }
    }
    next.hr = hr
  }

  // PU: WAR by team+unit. Accept either full team name or 3-letter abbr.
  if (Array.isArray(next.pu)) {
    next.pu = (next.pu as Array<{ team?: string; unit?: string; war?: number; r?: number }>).map(pick => {
      if (!pick.team || !pick.unit) return pick
      const teamAbbr = PU_TEAM_MAP[pick.team] ?? pick.team
      const alts = [teamAbbr]
      if (teamAbbr === 'CHW') alts.push('CWS')
      if (teamAbbr === 'CWS') alts.push('CHW')
      if (teamAbbr === 'SDP') alts.push('SD')
      if (teamAbbr === 'SFG') alts.push('SF')
      if (teamAbbr === 'TBR') alts.push('TB')
      if (teamAbbr === 'KCR') alts.push('KC')
      if (teamAbbr === 'WSN') alts.push('WSH')
      let match: UnitWAR | undefined
      for (const alt of alts) {
        match = ctx.unitWAR.find(u => u.team === alt && u.unit === pick.unit)
        if (match) break
      }
      return match ? { ...pick, war: match.war } : pick
    })
  }

  // CY: pitcher stats + live odds
  if (Array.isArray(next.cy)) {
    next.cy = (next.cy as Array<{ pitcher?: string; stats?: PitcherStats; liveOdds?: string }>).map(pick => {
      if (!pick.pitcher) return pick
      const out = { ...pick }
      const stats = ctx.cyStats[pick.pitcher]
      if (stats) out.stats = stats
      const odds = ctx.cyOdds[pick.pitcher]
      if (odds) out.liveOdds = odds
      return out
    })
  }

  // Awards odds (global market data — replicated to each player blob for legacy
  // component compatibility).
  if (Object.keys(ctx.awardsOdds).length > 0) {
    next.awardsOdds = ctx.awardsOdds
  }

  return next
}

// ---- Handler ---------------------------------------------------------------

export default async function handler(_req: Request) {
  const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
  if (!SUPA_URL || !SUPA_KEY) {
    return new Response(JSON.stringify({ error: 'Missing env vars' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPA_URL, SUPA_KEY)
  const startTime = Date.now()
  const updates: string[] = []

  try {
    // 0. Look up the current season so we only update active picks.
    const { data: settings, error: sErr } = await supabase
      .from('app_settings')
      .select('current_season')
      .eq('id', 1)
      .maybeSingle()
    if (sErr) throw sErr
    const currentSeason = (settings?.current_season as number | undefined) ?? new Date().getFullYear()

    // 1. Load current-season picks for every player.
    const { data: rows, error } = await supabase
      .from('player_picks')
      .select('player_id, data')
      .eq('season', currentSeason)
    if (error) throw error
    updates.push(`Season: ${currentSeason}`)
    if (!rows || rows.length === 0) {
      return new Response(JSON.stringify({ success: true, updates: ['no players'] }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 2. Collect unique player names (HR + CY) so we hit MLB's API once each.
    const hrNames = new Set<string>()
    const cyNames = new Set<string>()
    for (const row of rows as PicksRow[]) {
      const hr = row.data.hr as Record<string, { p?: string }> | undefined
      for (const slot of Object.values(hr ?? {})) {
        if (slot?.p) hrNames.add(slot.p)
      }
      const cy = row.data.cy as Array<{ pitcher?: string }> | undefined
      for (const pick of cy ?? []) {
        if (pick.pitcher) cyNames.add(pick.pitcher)
      }
    }

    // 3. Fetch all external data concurrently where independent.
    const [standings, projWins, unitWAR, awardOdds] = await Promise.all([
      fetchStandings(),
      fetchProjectedWins(),
      fetchUnitWAR(),
      fetchAllAwardOdds(),
    ])

    // HR + CY lookups must be sequential (each calls /people/search first).
    const hrCounts: Record<string, number> = {}
    for (const name of hrNames) {
      const v = await fetchPlayerHR(name)
      if (v != null) hrCounts[name] = v
    }
    const cyStats: Record<string, PitcherStats> = {}
    for (const name of cyNames) {
      const v = await fetchPitcherStats(name)
      if (v) cyStats[name] = v
    }

    updates.push(`Standings: ${Object.keys(standings).length} teams`)
    updates.push(`HR lookups: ${Object.keys(hrCounts).length}/${hrNames.size}`)
    updates.push(`PU WAR units: ${unitWAR.length}`)
    updates.push(`CY stats: ${Object.keys(cyStats).length}/${cyNames.size}`)
    updates.push(`CY odds: ${Object.keys(awardOdds.cy).length}`)
    updates.push(`Award categories: ${Object.keys(awardOdds.awards).length}`)
    updates.push(`Projected wins: ${Object.keys(projWins).length}`)

    // 4. Update each player's row.
    const ctx = {
      standings, projWins,
      hrCounts, cyStats,
      cyOdds: awardOdds.cy,
      unitWAR,
      awardsOdds: awardOdds.awards,
    }
    let saved = 0
    for (const row of rows as PicksRow[]) {
      const updated = updateOnePlayer(row.data, ctx)
      const { error: saveErr } = await supabase
        .from('player_picks')
        .update({ data: updated, updated_at: new Date().toISOString() })
        .eq('player_id', row.player_id)
        .eq('season', currentSeason)
      if (saveErr) {
        console.error('failed to save', row.player_id, saveErr)
      } else {
        saved++
      }
    }
    updates.push(`Players saved: ${saved}/${rows.length}`)

    return new Response(JSON.stringify({
      success: true, updates, elapsed: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'unknown' }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
