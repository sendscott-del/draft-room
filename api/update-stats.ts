import { createClient } from '@supabase/supabase-js'

const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(SUPA_URL, SUPA_KEY)

const SEASON = 2026

// MLB team ID → app abbreviation mapping
const MLB_TEAM_MAP: Record<number, string> = {
  109: 'ARI', 144: 'ATL', 110: 'BAL', 111: 'BOS', 112: 'CHC',
  145: 'CWS', 113: 'CIN', 114: 'CLE', 115: 'COL', 116: 'DET',
  117: 'HOU', 118: 'KCR', 108: 'LAA', 119: 'LAD', 146: 'MIA',
  158: 'MIL', 142: 'MIN', 121: 'NYM', 147: 'NYY', 133: 'OAK',
  143: 'PHI', 134: 'PIT', 135: 'SDP', 136: 'SEA', 137: 'SFG',
  138: 'STL', 139: 'TBR', 140: 'TEX', 141: 'TOR', 120: 'WSN',
}

// HR Team player name → MLB search name mapping (handles nicknames)
const PLAYER_SEARCH_NAMES: Record<string, string> = {
  'Vladdy Jr': 'Vladimir Guerrero Jr',
  'Bobby Witt Jr': 'Bobby Witt Jr',
  'Junior Caminero': 'Junior Caminero',
}

interface StandingsTeam {
  team: { id: number }
  wins: number
  losses: number
}

interface HittingStats {
  homeRuns: number
}

interface PlayerStats {
  person: { id: number; fullName: string }
  stats: Array<{ splits: Array<{ stat: HittingStats }> }>
}

// Fetch current standings (wins per team)
async function fetchStandings(): Promise<Record<string, number>> {
  const wins: Record<string, number> = {}
  try {
    const res = await fetch(
      `https://statsapi.mlb.com/api/v1/standings?leagueId=103,104&season=${SEASON}&standingsTypes=regularSeason`
    )
    const data = await res.json()
    for (const record of data.records || []) {
      for (const team of (record.teamRecords || []) as StandingsTeam[]) {
        const abbr = MLB_TEAM_MAP[team.team.id]
        if (abbr) wins[abbr] = team.wins
      }
    }
  } catch (e) {
    console.error('Failed to fetch standings:', e)
  }
  return wins
}

// Fetch HR count for a specific player by name
async function fetchPlayerHR(playerName: string): Promise<number | null> {
  try {
    const searchName = PLAYER_SEARCH_NAMES[playerName] || playerName
    // Search for player
    const searchRes = await fetch(
      `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(searchName)}&sportIds=1&active=true`
    )
    const searchData = await searchRes.json()
    const person = searchData.people?.[0]
    if (!person) {
      console.log(`Player not found: ${playerName}`)
      return null
    }

    // Get season stats
    const statsRes = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${person.id}/stats?stats=season&season=${SEASON}&group=hitting`
    )
    const statsData = await statsRes.json()
    const splits = statsData.stats?.[0]?.splits
    if (!splits || splits.length === 0) return 0

    return splits[0].stat?.homeRuns ?? 0
  } catch (e) {
    console.error(`Failed to fetch HR for ${playerName}:`, e)
    return null
  }
}

// Fetch WAR data from FanGraphs leaderboard
async function fetchWAR(): Promise<Record<string, number>> {
  const teamWAR: Record<string, Record<string, number>> = {}

  // Unit type mapping — we need WAR by team and unit type
  // INF+C = C+1B+2B+3B+SS, OF = LF+CF+RF, SP = starting pitchers, RP = relief pitchers

  try {
    // Hitting WAR (position players)
    const hitRes = await fetch(
      `https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=bat&lg=all&qual=0&season=${SEASON}&month=0&team=0%2Cts&pageitems=50&pagenum=1&ind=0&rost=0&players=0&type=8&postseason=&sortdir=default&sortstat=WAR`
    )
    if (hitRes.ok) {
      const hitData = await hitRes.json()
      for (const row of hitData.data || []) {
        const team = row.TeamName || row.Team
        if (team && row.WAR != null) {
          if (!teamWAR[team]) teamWAR[team] = {}
          teamWAR[team].hitting = (teamWAR[team].hitting || 0) + row.WAR
        }
      }
    }

    // Pitching WAR
    const pitRes = await fetch(
      `https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=pit&lg=all&qual=0&season=${SEASON}&month=0&team=0%2Cts&pageitems=50&pagenum=1&ind=0&rost=0&players=0&type=8&postseason=&sortdir=default&sortstat=WAR`
    )
    if (pitRes.ok) {
      const pitData = await pitRes.json()
      for (const row of pitData.data || []) {
        const team = row.TeamName || row.Team
        if (team && row.WAR != null) {
          if (!teamWAR[team]) teamWAR[team] = {}
          teamWAR[team].pitching = (teamWAR[team].pitching || 0) + row.WAR
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch WAR:', e)
  }

  // Flatten — for now return total team WAR (hitting + pitching)
  const result: Record<string, number> = {}
  for (const [team, wars] of Object.entries(teamWAR)) {
    result[team] = Math.round(((wars.hitting || 0) + (wars.pitching || 0)) * 10) / 10
  }
  return result
}

export default async function handler(req: any, res: any) {
  const startTime = Date.now()
  const updates: string[] = []

  // Debug: check env vars
  if (!SUPA_URL || !SUPA_KEY) {
    return res.status(500).json({
      error: 'Missing env vars',
      hasUrl: !!SUPA_URL,
      hasKey: !!SUPA_KEY,
      urlPrefix: SUPA_URL.substring(0, 20),
    })
  }

  try {
    // Load current data
    const { data: row, error: loadError } = await supabase
      .from('draft_room')
      .select('data')
      .eq('id', 1)
      .single()

    if (loadError || !row?.data) {
      return res.status(500).json({ error: 'Failed to load data', details: loadError?.message, hasRow: !!row })
    }

    const appData = row.data as any

    // 1. Update standings (win totals for O/U)
    const standings = await fetchStandings()
    const standingsCount = Object.keys(standings).length
    if (standingsCount > 0) {
      for (const player of ['Scott', 'Ty']) {
        if (!appData.ou?.[player]) continue
        for (const [abbr, wins] of Object.entries(standings)) {
          if (appData.ou[player][abbr]) {
            appData.ou[player][abbr].actual = String(wins)
          }
        }
      }
      updates.push(`Standings: ${standingsCount} teams updated`)
    }

    // 2. Update HR counts
    let hrUpdated = 0
    for (const player of ['Scott', 'Ty']) {
      if (!appData.hr?.[player]) continue
      for (const [pos, slot] of Object.entries(appData.hr[player] as Record<string, any>)) {
        if (!slot.p) continue
        const hr = await fetchPlayerHR(slot.p)
        if (hr !== null) {
          slot.hr = hr
          hrUpdated++
        }
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200))
      }
    }
    if (hrUpdated > 0) updates.push(`HR: ${hrUpdated} players updated`)

    // 3. Save updated data
    const { error: saveError } = await supabase
      .from('draft_room')
      .update({ data: appData, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (saveError) {
      return res.status(500).json({ error: 'Failed to save', details: saveError.message })
    }

    const elapsed = Date.now() - startTime
    return res.status(200).json({
      success: true,
      updates,
      elapsed: `${elapsed}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return res.status(500).json({ error: e.message })
  }
}
