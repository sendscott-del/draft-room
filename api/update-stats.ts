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
}

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

async function fetchPlayerHR(playerName: string): Promise<number | null> {
  try {
    const searchName = PLAYER_SEARCH_NAMES[playerName] || playerName
    const searchRes = await fetch(
      `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(searchName)}&sportIds=1&active=true`
    )
    const searchData = await searchRes.json()
    const person = searchData.people?.[0]
    if (!person) return null

    const statsRes = await fetch(
      `https://statsapi.mlb.com/api/v1/people/${person.id}/stats?stats=season&season=${SEASON}&group=hitting`
    )
    const statsData = await statsRes.json()
    const splits = statsData.stats?.[0]?.splits
    if (!splits || splits.length === 0) return 0

    return splits[0].stat?.homeRuns ?? 0
  } catch {
    return null
  }
}

export default async function handler(req: Request) {
  const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

  if (!SUPA_URL || !SUPA_KEY) {
    return new Response(JSON.stringify({
      error: 'Missing env vars',
      hasUrl: !!SUPA_URL,
      hasKey: !!SUPA_KEY,
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }

  const supabase = createClient(SUPA_URL, SUPA_KEY)
  const startTime = Date.now()
  const updates: string[] = []

  try {
    // Load current data
    const { data: row, error: loadError } = await supabase
      .from('draft_room')
      .select('data')
      .eq('id', 1)
      .single()

    if (loadError || !row?.data) {
      return new Response(JSON.stringify({
        error: 'Failed to load data',
        details: loadError?.message,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
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
      updates.push(`Standings: ${standingsCount} teams`)
    }

    // 2. Update HR counts
    let hrUpdated = 0
    for (const player of ['Scott', 'Ty']) {
      if (!appData.hr?.[player]) continue
      for (const [, slot] of Object.entries(appData.hr[player] as Record<string, any>)) {
        if (!slot.p) continue
        const hr = await fetchPlayerHR(slot.p)
        if (hr !== null) {
          slot.hr = hr
          hrUpdated++
        }
      }
    }
    if (hrUpdated > 0) updates.push(`HR: ${hrUpdated} players`)

    // 3. Save
    const { error: saveError } = await supabase
      .from('draft_room')
      .update({ data: appData, updated_at: new Date().toISOString() })
      .eq('id', 1)

    if (saveError) {
      return new Response(JSON.stringify({
        error: 'Failed to save',
        details: saveError.message,
      }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const elapsed = Date.now() - startTime
    return new Response(JSON.stringify({
      success: true,
      updates,
      elapsed: `${elapsed}ms`,
      timestamp: new Date().toISOString(),
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
