import { createClient } from '@supabase/supabase-js'

export const config = { runtime: 'edge' }

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

// ── Standings ────────────────────────────────────────────────
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
  } catch (e) {
    console.error('Failed to fetch standings:', e)
  }
  return wins
}

// ── MLB Player Search Helper ─────────────────────────────────
async function searchPlayer(name: string): Promise<number | null> {
  try {
    const searchName = PLAYER_SEARCH_NAMES[name] || name
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(searchName)}&sportIds=1&active=true`
    )
    const data = await res.json()
    return data.people?.[0]?.id ?? null
  } catch {
    return null
  }
}

// ── HR Counts ────────────────────────────────────────────────
async function fetchPlayerHR(playerName: string): Promise<number | null> {
  try {
    const id = await searchPlayer(playerName)
    if (!id) return null
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season&season=${SEASON}&group=hitting`
    )
    const data = await res.json()
    const splits = data.stats?.[0]?.splits
    if (!splits || splits.length === 0) return 0
    return splits[0].stat?.homeRuns ?? 0
  } catch {
    return null
  }
}

// ── Pitcher Stats ────────────────────────────────────────────
interface PitcherStats {
  era: string; w: number; l: number; k: number; ip: string
}

async function fetchPitcherStats(pitcherName: string): Promise<PitcherStats | null> {
  try {
    const id = await searchPlayer(pitcherName)
    if (!id) return null
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season&season=${SEASON}&group=pitching`
    )
    const data = await res.json()
    const splits = data.stats?.[0]?.splits
    if (!splits || splits.length === 0) return { era: '-.--', w: 0, l: 0, k: 0, ip: '0.0' }
    const s = splits[0].stat
    return {
      era: s?.era ?? '-.--',
      w: s?.wins ?? 0,
      l: s?.losses ?? 0,
      k: s?.strikeOuts ?? 0,
      ip: s?.inningsPitched ?? '0.0',
    }
  } catch {
    return null
  }
}

// ── Projected Wins (FanGraphs) ───────────────────────────────
// FanGraphs team abbreviations → our abbreviations
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

async function fetchProjectedWins(): Promise<Record<string, number>> {
  const projWins: Record<string, number> = {}
  try {
    const res = await fetch(
      `https://www.fangraphs.com/api/playoff-odds/odds?season=${SEASON}`
    )
    if (res.ok) {
      const data = await res.json()
      for (const team of data) {
        const abbr = FG_TEAM_MAP[team.abbName] || team.abbName
        const expW = team.endData?.ExpW
        if (abbr && expW != null) {
          projWins[abbr] = Math.round(expW * 10) / 10
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch projected wins:', e)
  }
  return projWins
}

// ── Position Unit WAR (FanGraphs) ────────────────────────────
// Map team names used in picks to FanGraphs team abbreviations
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

// Position → unit mapping
function posToUnit(pos: string): 'INF+C' | 'OF' | null {
  if (!pos) return null
  // Handle multi-position like "DH/OF", "1B/3B/DH"
  const parts = pos.split('/')
  const infC = ['C', '1B', '2B', '3B', 'SS']
  const of = ['LF', 'CF', 'RF', 'OF']

  // Check if any part is OF
  if (parts.some(p => of.includes(p.trim()))) return 'OF'
  // Check if any part is infield/catcher
  if (parts.some(p => infC.includes(p.trim()))) return 'INF+C'
  // DH without OF — count as INF+C
  if (parts.some(p => p.trim() === 'DH')) return 'INF+C'
  return null
}

interface UnitWAR {
  team: string
  unit: string
  war: number
}

async function fetchUnitWAR(): Promise<UnitWAR[]> {
  const unitWars: Record<string, Record<string, number>> = {} // team -> unit -> war

  try {
    // Fetch batting WAR (all qualified + unqualified)
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

    // Fetch pitching WAR
    const pitRes = await fetch(
      `https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=pit&lg=all&qual=0&season=${SEASON}&month=0&team=0&pageitems=2000&pagenum=1&ind=0&rost=0&players=0&type=8&postseason=&sortdir=default&sortstat=WAR`
    )
    if (pitRes.ok) {
      const pitData = await pitRes.json()
      for (const p of pitData.data || pitData || []) {
        const teamAbbr = p.TeamNameAbb || p.Team || ''
        const war = Number(p.WAR) || 0
        // Determine SP vs RP: GS (games started) > half of G (games) = SP
        const gs = Number(p.GS) || 0
        const g = Number(p.G) || 1
        const unit = gs / g >= 0.5 ? 'SP' : 'RP'
        if (!teamAbbr) continue
        if (!unitWars[teamAbbr]) unitWars[teamAbbr] = {}
        unitWars[teamAbbr][unit] = (unitWars[teamAbbr][unit] || 0) + war
      }
    }
  } catch (e) {
    console.error('Failed to fetch unit WAR:', e)
  }

  // Flatten to array
  const result: UnitWAR[] = []
  for (const [team, units] of Object.entries(unitWars)) {
    for (const [unit, war] of Object.entries(units)) {
      result.push({ team, unit, war: Math.round(war * 10) / 10 })
    }
  }
  return result
}

// ── Award Odds (The Odds API) ────────────────────────────────
// Fetches odds for all MLB awards: MVP, ROY, CY Young, etc.
// Returns { "al_mvp": { "Aaron Judge": "+200", ... }, "nl_cy_young": { ... }, ... }
// Also returns CY-specific odds for backward compatibility
interface AllAwardOdds {
  cy: Record<string, string>  // pitcher name → odds
  awards: Record<string, Record<string, string>>  // category → { player → odds }
}

// Map The Odds API sport titles to our award category keys
const AWARD_TITLE_MAP: Record<string, string> = {
  'al mvp': 'alMVP',
  'nl mvp': 'nlMVP',
  'al rookie of the year': 'alROY',
  'nl rookie of the year': 'nlROY',
  'al cy young': 'alCY',
  'nl cy young': 'nlCY',
  'al manager of the year': 'alMGR',
  'nl manager of the year': 'nlMGR',
  // Alternate names
  'american league mvp': 'alMVP',
  'national league mvp': 'nlMVP',
  'american league rookie': 'alROY',
  'national league rookie': 'nlROY',
  'american league cy young': 'alCY',
  'national league cy young': 'nlCY',
}

async function fetchAllAwardOdds(): Promise<AllAwardOdds> {
  const result: AllAwardOdds = { cy: {}, awards: {} }
  const apiKey = process.env.ODDS_API_KEY
  if (!apiKey) return result

  try {
    const sportsRes = await fetch(`https://api.the-odds-api.com/v4/sports?apiKey=${apiKey}`)
    const sports = await sportsRes.json()

    // Find all MLB outright markets (awards, futures)
    const mlbKeys = sports
      .filter((s: any) => s.key?.includes('baseball_mlb') && s.has_outrights)
      .map((s: any) => s.key)

    for (const key of mlbKeys) {
      const oddsRes = await fetch(
        `https://api.the-odds-api.com/v4/sports/${key}/odds?apiKey=${apiKey}&regions=us&markets=outrights&oddsFormat=american`
      )
      if (!oddsRes.ok) continue

      const oddsData = await oddsRes.json()
      for (const event of oddsData) {
        const title = (event.sport_title || '').toLowerCase()

        // Extract outcomes from first bookmaker
        const outcomes: { name: string; price: number }[] = []
        for (const bookmaker of event.bookmakers || []) {
          for (const market of bookmaker.markets || []) {
            for (const outcome of market.outcomes || []) {
              if (outcome.name && outcome.price != null) {
                outcomes.push({ name: outcome.name, price: outcome.price })
              }
            }
          }
          break // first bookmaker only
        }

        if (outcomes.length === 0) continue

        const oddsMap: Record<string, string> = {}
        for (const o of outcomes) {
          const prefix = o.price >= 0 ? '+' : ''
          oddsMap[o.name] = `${prefix}${o.price}`
        }

        // CY Young → also save to cy-specific map
        if (title.includes('cy young')) {
          Object.assign(result.cy, oddsMap)
        }

        // Map to our category keys
        for (const [pattern, cat] of Object.entries(AWARD_TITLE_MAP)) {
          if (title.includes(pattern)) {
            result.awards[cat] = { ...(result.awards[cat] || {}), ...oddsMap }
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch award odds:', e)
  }
  return result
}

// ── Main Handler ─────────────────────────────────────────────
export default async function handler(req: Request) {
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
    const { data: row, error: loadError } = await supabase
      .from('draft_room')
      .select('data')
      .eq('id', 1)
      .single()

    if (loadError || !row?.data) {
      return new Response(JSON.stringify({
        error: 'Failed to load data', details: loadError?.message,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const appData = row.data as any

    // 1. Update standings
    const standings = await fetchStandings()
    if (Object.keys(standings).length > 0) {
      for (const player of ['Scott', 'Ty']) {
        if (!appData.ou?.[player]) continue
        for (const [abbr, wins] of Object.entries(standings)) {
          if (appData.ou[player][abbr]) {
            appData.ou[player][abbr].actual = String(wins)
          }
        }
      }
      updates.push(`Standings: ${Object.keys(standings).length} teams`)
    }

    // 2. Update HR counts
    let hrUpdated = 0
    for (const player of ['Scott', 'Ty']) {
      if (!appData.hr?.[player]) continue
      for (const [, slot] of Object.entries(appData.hr[player] as Record<string, any>)) {
        if (!slot.p) continue
        const hr = await fetchPlayerHR(slot.p)
        if (hr !== null) { slot.hr = hr; hrUpdated++ }
      }
    }
    updates.push(`HR: ${hrUpdated}/18 players`)

    // 3. Update Position Unit WAR
    const unitWARData = await fetchUnitWAR()
    let puUpdated = 0
    const puMissing: string[] = []
    if (unitWARData.length > 0) {
      // Collect all team abbrs from FanGraphs for debugging
      const fgTeams = new Set(unitWARData.map(u => u.team))

      for (const player of ['Scott', 'Ty']) {
        if (!appData.pu?.[player]) continue
        for (let i = 0; i < appData.pu[player].length; i++) {
          const pick = appData.pu[player][i]
          const teamAbbr = PU_TEAM_MAP[pick.team]
          if (!teamAbbr) { puMissing.push(`${pick.team}: no abbr mapping`); continue }

          // Try exact match and common alternatives
          const alts = [teamAbbr]
          if (teamAbbr === 'CHW') alts.push('CWS', 'CHW')
          if (teamAbbr === 'CWS') alts.push('CHW')
          if (teamAbbr === 'SDP') alts.push('SD', 'SDP')
          if (teamAbbr === 'SFG') alts.push('SF', 'SFG')
          if (teamAbbr === 'TBR') alts.push('TB', 'TBR')
          if (teamAbbr === 'KCR') alts.push('KC', 'KCR')
          if (teamAbbr === 'WSN') alts.push('WSH', 'WSN')

          let match = null
          for (const alt of alts) {
            match = unitWARData.find(u => u.team === alt && u.unit === pick.unit)
            if (match) break
          }

          if (match) {
            appData.pu[player][i] = { ...pick, war: match.war }
            puUpdated++
          } else {
            puMissing.push(`${pick.team}(${teamAbbr}) ${pick.unit}`)
          }
        }
      }
      updates.push(`PU WAR: ${puUpdated}/24 units`)
      if (puMissing.length > 0) updates.push(`PU missing: ${puMissing.join(', ')}`)
    } else {
      updates.push('PU WAR: no data from FanGraphs')
    }

    // 4. Update CY pitcher stats (ERA, W-L, K, IP)
    let cyUpdated = 0
    for (const player of ['Scott', 'Ty']) {
      if (!appData.cy?.[player]) continue
      for (let i = 0; i < appData.cy[player].length; i++) {
        const pick = appData.cy[player][i]
        if (!pick.pitcher) continue
        const stats = await fetchPitcherStats(pick.pitcher)
        if (stats) {
          appData.cy[player][i] = { ...pick, stats }
          cyUpdated++
        }
      }
    }
    updates.push(`CY stats: ${cyUpdated}/20 pitchers`)

    // 5. Update all award odds (CY + MVP + ROY + MGR)
    const allOdds = await fetchAllAwardOdds()

    // 5a. CY odds on pitcher cards
    let cyOddsUpdated = 0
    if (Object.keys(allOdds.cy).length > 0) {
      for (const player of ['Scott', 'Ty']) {
        if (!appData.cy?.[player]) continue
        for (let i = 0; i < appData.cy[player].length; i++) {
          const pick = appData.cy[player][i]
          const matchedOdds = allOdds.cy[pick.pitcher]
          if (matchedOdds) {
            appData.cy[player][i] = { ...pick, liveOdds: matchedOdds }
            cyOddsUpdated++
          }
        }
      }
      updates.push(`CY odds: ${cyOddsUpdated} matched`)
    } else {
      updates.push('CY odds: no API key or no data')
    }

    // 5b. Award odds saved to appData.awardsOdds for the Awards component
    if (Object.keys(allOdds.awards).length > 0) {
      appData.awardsOdds = allOdds.awards
      updates.push(`Award odds: ${Object.keys(allOdds.awards).length} categories`)
    } else {
      updates.push('Award odds: no data')
    }

    // 6. Update projected wins for O/U
    const projWins = await fetchProjectedWins()
    let projUpdated = 0
    if (Object.keys(projWins).length > 0) {
      for (const player of ['Scott', 'Ty']) {
        if (!appData.ou?.[player]) continue
        for (const [abbr, proj] of Object.entries(projWins)) {
          if (appData.ou[player][abbr]) {
            appData.ou[player][abbr].projected = proj
            projUpdated++
          }
        }
      }
      updates.push(`Projected wins: ${projUpdated / 2} teams`)
    } else {
      updates.push('Projected wins: no data')
    }

    // 7. Save
    const { error: saveError } = await supabase
      .from('draft_room')
      .update({ data: appData, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (saveError) {
      return new Response(JSON.stringify({
        error: 'Failed to save', details: saveError.message,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({
      success: true, updates, elapsed: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
