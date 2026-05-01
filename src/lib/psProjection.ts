/**
 * Postseason projection.
 *
 * Inputs: per-team FanGraphs probabilities (replicated to every picks blob
 * by the daily `update-stats` job). We derive the most likely outcomes —
 * division winners, wild cards, pennants, World Series — and score each
 * player's PSPicks against that outcome map.
 *
 * Scoring rubric (max 93 points):
 *   - Division winner correct:  5 pts each (× 6)
 *   - Wild card correct:        3 pts each (× 6, slot-agnostic)
 *   - AL pennant correct:      10 pts
 *   - NL pennant correct:      10 pts
 *   - World Series correct:    25 pts
 */
import type { PSPicks } from '../types'

export interface TeamPlayoffOdds {
  w: number
  l: number
  league: 'AL' | 'NL'
  division: 'E' | 'C' | 'W'
  divTitle: number
  wcTitle: number
  csWin: number
  wsWin: number
}

export type PlayoffOddsMap = Record<string, TeamPlayoffOdds>

export interface PSOutcomes {
  divisions: { alEast: string; alCentral: string; alWest: string; nlEast: string; nlCentral: string; nlWest: string }
  wildCards: { al: string[]; nl: string[] } // 3 teams each, in odds order
  pennants: { al: string; nl: string }
  ws: string
}

const DIVISION_KEYS = {
  AL: { E: 'alEast', C: 'alCentral', W: 'alWest' },
  NL: { E: 'nlEast', C: 'nlCentral', W: 'nlWest' },
} as const

/** Returns true if we have enough FG data to produce an outcomes map. */
export function hasEnoughOdds(odds?: PlayoffOddsMap | null): boolean {
  if (!odds) return false
  return Object.keys(odds).length >= 28
}

/** Derive the most-likely Postseason outcomes from FG probabilities. */
export function derivePSOutcomes(odds: PlayoffOddsMap): PSOutcomes {
  const teams = Object.entries(odds).map(([abbr, o]) => ({ abbr, ...o }))

  // Division winners — top divTitle per (league, division).
  const divisions = {
    alEast: '', alCentral: '', alWest: '', nlEast: '', nlCentral: '', nlWest: '',
  } as PSOutcomes['divisions']
  for (const lg of ['AL', 'NL'] as const) {
    for (const div of ['E', 'C', 'W'] as const) {
      const winner = teams
        .filter(t => t.league === lg && t.division === div)
        .sort((a, b) => b.divTitle - a.divTitle)[0]
      if (winner) divisions[DIVISION_KEYS[lg][div]] = winner.abbr
    }
  }

  // Wild cards — top 3 wcTitle in each league among non-division-winners.
  const divisionWinners = new Set<string>(Object.values(divisions))
  const wildCards = { al: [] as string[], nl: [] as string[] }
  for (const lg of ['AL', 'NL'] as const) {
    const sorted = teams
      .filter(t => t.league === lg && !divisionWinners.has(t.abbr))
      .sort((a, b) => b.wcTitle - a.wcTitle)
    const slot = lg === 'AL' ? wildCards.al : wildCards.nl
    for (const t of sorted.slice(0, 3)) slot.push(t.abbr)
  }

  // Pennants — top csWin per league.
  const pennants = { al: '', nl: '' }
  for (const lg of ['AL', 'NL'] as const) {
    const champ = teams
      .filter(t => t.league === lg)
      .sort((a, b) => b.csWin - a.csWin)[0]
    if (champ) (lg === 'AL' ? (pennants.al = champ.abbr) : (pennants.nl = champ.abbr))
  }

  // World Series — top wsWin overall.
  const ws = [...teams].sort((a, b) => b.wsWin - a.wsWin)[0]?.abbr ?? ''

  return { divisions, wildCards, pennants, ws }
}

/** Score a player's PSPicks against the given outcomes map. */
export function scorePSAgainstOutcomes(ps: PSPicks | undefined, out: PSOutcomes): number {
  if (!ps) return 0
  let pts = 0

  // Divisions: 5 pts each correct.
  for (const k of ['alEast', 'alCentral', 'alWest', 'nlEast', 'nlCentral', 'nlWest'] as const) {
    if (ps.divisions?.[k] && ps.divisions[k] === out.divisions[k]) pts += 5
  }

  // Wild cards: 3 pts each correct (slot-agnostic — we only check membership).
  for (const lg of ['al', 'nl'] as const) {
    const picked = (ps.wildCards?.[lg] ?? []).filter(Boolean)
    const actual = new Set(out.wildCards[lg])
    for (const team of picked) if (actual.has(team)) pts += 3
  }

  // Pennants: 10 each.
  if (ps.pennants?.al && ps.pennants.al === out.pennants.al) pts += 10
  if (ps.pennants?.nl && ps.pennants.nl === out.pennants.nl) pts += 10

  // World Series: 25.
  if (ps.ws && ps.ws === out.ws) pts += 25

  return pts
}

/** Convenience: project a single player's PS score from raw FG odds. */
export function projectPSScore(ps: PSPicks | undefined, odds?: PlayoffOddsMap | null): number {
  if (!hasEnoughOdds(odds)) return 0
  const out = derivePSOutcomes(odds!)
  return scorePSAgainstOutcomes(ps, out)
}
