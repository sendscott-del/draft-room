/**
 * Awards Vote Projection Algorithm
 *
 * Projects end-of-season award results for MVP, ROY, Cy Young, and Manager of Year.
 *
 * BBWAA Award Voting:
 * - MVP: 30 voters, rank 10. Points: 14-9-8-7-6-5-4-3-2-1. Max 420.
 * - ROY: 30 voters, rank 3. Points: 5-3-1. Max 150.
 * - CY: 30 voters, rank 5. Points: 7-4-3-2-1. Max 210.
 * - MGR: 30 voters, rank 3. Points: 5-3-1. Max 150.
 *
 * Game scoring: Winner=25, Top3=10, Top10=5, None=0
 *
 * Three-tier approach:
 * 1. If betting odds available → convert to implied probability
 * 2. If no odds but current stats available → rank by performance
 * 3. Fallback → conservative estimate based on pick quality
 */

import type { AwardPicks } from '../types'

function oddsToProb(odds: string): number {
  if (!odds) return 0
  const n = parseInt(odds.replace('+', ''))
  if (isNaN(n)) return 0
  if (n > 0) return 100 / (n + 100)
  return Math.abs(n) / (Math.abs(n) + 100)
}

export type ProjectedResult = 'winner' | 'finalist' | 'top10' | 'none'

export interface AwardProjection {
  result: ProjectedResult
  points: number
  odds?: string
  impliedProb?: number
  confidence: 'low' | 'medium' | 'high'
  note?: string
}

const GAME_PTS: Record<ProjectedResult, number> = { winner: 25, finalist: 10, top10: 5, none: 0 }

function projectFromOdds(odds: string): AwardProjection {
  const prob = oddsToProb(odds)
  if (prob === 0) return { result: 'none', points: 0, confidence: 'low' }

  let result: ProjectedResult
  let note: string
  if (prob >= 0.40) { result = 'winner'; note = 'Heavy favorite' }
  else if (prob >= 0.20) { result = 'finalist'; note = 'Strong contender' }
  else if (prob >= 0.08) { result = 'top10'; note = 'In the mix' }
  else if (prob >= 0.03) { result = 'top10'; note = 'Longshot contender' }
  else { result = 'none'; note = 'Very long odds' }

  return {
    result,
    points: GAME_PTS[result],
    odds,
    impliedProb: Math.round(prob * 1000) / 10,
    confidence: prob >= 0.15 ? 'high' : prob >= 0.05 ? 'medium' : 'low',
    note,
  }
}

// Known favorites / projected leaders for 2026 (used when no odds available)
// These are based on preseason projections and update as season progresses
const PRESEASON_FAVORITES: Record<string, string[]> = {
  alMVP: ['Aaron Judge', 'Bobby Witt Jr', 'Gunnar Henderson', 'Juan Soto', 'Yordan Alvarez'],
  nlMVP: ['Shohei Ohtani', 'Fernando Tatis Jr', 'Mookie Betts', 'Freddie Freeman', 'Elly De La Cruz'],
  alROY: ['Travis Bazzana', 'Jace Jung', 'Charlie Condon', 'Munetaka Murakami', 'Kevin McGonigle'],
  nlROY: ['Konnor Griffin', 'Sal Stewart', 'Ethan Salas', 'Nick Kurtz', 'Sebastian Walcott'],
  alCY: ['Tarik Skubal', 'Garrett Crochet', 'Max Fried', 'Cole Ragans', 'Jacob deGrom'],
  nlCY: ['Paul Skenes', 'Cristopher Sanchez', 'Yoshinobu Yamamoto', 'Logan Webb', 'Freddy Peralta'],
  alMGR: ['Craig Albernaz', 'Aaron Boone', 'Alex Cora', 'Dan Wilson', 'Bruce Bochy'],
  nlMGR: ['Craig Counsell', 'Dave Roberts', 'Carlos Mendoza', 'Pat Murphy', 'Don Kelly'],
}

function projectWithoutOdds(pickName: string, category: string): AwardProjection {
  if (!pickName) return { result: 'none', points: 0, confidence: 'low' }

  const favorites = PRESEASON_FAVORITES[category] || []
  const rank = favorites.findIndex(f => f.toLowerCase() === pickName.toLowerCase())

  if (rank === 0) {
    return { result: 'winner', points: 25, confidence: 'low', note: 'Preseason favorite' }
  } else if (rank >= 1 && rank <= 2) {
    return { result: 'finalist', points: 10, confidence: 'low', note: `Preseason top ${rank + 1}` }
  } else if (rank >= 3 && rank <= 4) {
    return { result: 'top10', points: 5, confidence: 'low', note: `Preseason top ${rank + 1}` }
  } else {
    // Not in our preseason list — use category to determine likelihood
    if (category.includes('MGR')) {
      // Manager picks are harder to predict — default to top10
      return { result: 'top10', points: 5, confidence: 'low', note: 'Manager race wide open' }
    } else if (category.includes('ROY')) {
      // ROY is unpredictable — give benefit of the doubt
      return { result: 'top10', points: 5, confidence: 'low', note: 'Rookie race unpredictable' }
    } else {
      // MVP/CY not in favorites = longshot
      return { result: 'none', points: 0, confidence: 'low', note: 'Not in preseason favorites' }
    }
  }
}

/**
 * Project all awards and show the projected field for each category.
 */
export function projectAwards(
  aw: { Scott: AwardPicks; Ty: AwardPicks },
  awardsOdds: Record<string, Record<string, string>>
): {
  Scott: Record<string, AwardProjection>
  Ty: Record<string, AwardProjection>
  totals: { Scott: number; Ty: number }
  fields: Record<string, { winner: string; top3: string[]; top10: string[] }>
} {
  const categories = ['alMVP', 'nlMVP', 'alROY', 'nlROY', 'alCY', 'nlCY', 'alMGR', 'nlMGR']

  const result: { Scott: Record<string, AwardProjection>; Ty: Record<string, AwardProjection> } = {
    Scott: {}, Ty: {},
  }
  const totals = { Scott: 0, Ty: 0 }

  // Build projected fields (who's projected to win each award)
  const fields: Record<string, { winner: string; top3: string[]; top10: string[] }> = {}

  for (const cat of categories) {
    const catOdds = awardsOdds[cat] || {}
    const hasOdds = Object.keys(catOdds).length > 0

    // Build field ranking from odds
    if (hasOdds) {
      const ranked = Object.entries(catOdds)
        .map(([name, odds]) => ({ name, prob: oddsToProb(odds) }))
        .sort((a, b) => b.prob - a.prob)

      fields[cat] = {
        winner: ranked[0]?.name || '',
        top3: ranked.slice(0, 3).map(r => r.name),
        top10: ranked.slice(0, 10).map(r => r.name),
      }
    } else {
      // Use preseason favorites
      const favs = PRESEASON_FAVORITES[cat] || []
      fields[cat] = {
        winner: favs[0] || '',
        top3: favs.slice(0, 3),
        top10: favs.slice(0, 10),
      }
    }

    // Project each player's pick
    for (const player of ['Scott', 'Ty'] as const) {
      const pickName = aw[player][cat as keyof AwardPicks] as string
      if (!pickName) {
        result[player][cat] = { result: 'none', points: 0, confidence: 'low' }
        continue
      }

      const playerOdds = catOdds[pickName] || ''
      if (playerOdds) {
        result[player][cat] = projectFromOdds(playerOdds)
      } else if (hasOdds) {
        // Odds exist for this category but not our pick → they're a longshot
        result[player][cat] = { result: 'none', points: 0, confidence: 'medium', note: 'Not in current odds' }
      } else {
        result[player][cat] = projectWithoutOdds(pickName, cat)
      }

      totals[player] += result[player][cat].points
    }
  }

  return { ...result, totals, fields }
}
