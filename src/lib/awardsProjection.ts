/**
 * Awards Vote Projection Algorithm
 *
 * Projects end-of-season award results for MVP, ROY, Cy Young, and Manager of Year.
 * Uses betting odds to estimate where each picked player will finish.
 *
 * BBWAA Award Voting Systems:
 *
 * MVP: 30 voters, rank 10 players. 14-9-8-7-6-5-4-3-2-1 points. Max 420.
 * ROY: 30 voters, rank 3 players. 5-3-1 points. Max 150.
 * CY Young: 30 voters, rank 5 pitchers. 7-4-3-2-1 points. Max 210.
 * Manager: 30 voters, rank 3 managers. 5-3-1 points. Max 150.
 *
 * Game scoring rules:
 * - Winner: 25 pts
 * - Top 3 finalist: 10 pts
 * - Top 10: 5 pts
 * - None: 0 pts
 *
 * Projection approach:
 * Convert betting odds → implied probability of winning.
 * Use probability to estimate likely finish:
 * - >40% implied prob → project as "winner" (25 pts)
 * - 15-40% → project as "finalist" (10 pts)
 * - 5-15% → project as "top10" (5 pts)
 * - <5% → project as "none" (0 pts)
 *
 * For Manager of Year, no reliable odds exist early season, so
 * we project based on team win differential vs preseason expectations.
 */

import type { AwardPicks } from '../types'

// Convert American odds to implied probability (0-1)
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
}

const GAME_PTS: Record<ProjectedResult, number> = { winner: 25, finalist: 10, top10: 5, none: 0 }

/**
 * Project award result from betting odds.
 */
function projectFromOdds(odds: string): AwardProjection {
  const prob = oddsToProb(odds)
  if (prob === 0) {
    return { result: 'none', points: 0, confidence: 'low' }
  }

  let result: ProjectedResult
  if (prob >= 0.40) result = 'winner'
  else if (prob >= 0.15) result = 'finalist'
  else if (prob >= 0.05) result = 'top10'
  else result = 'none'

  return {
    result,
    points: GAME_PTS[result],
    odds,
    impliedProb: Math.round(prob * 1000) / 10, // e.g. 23.5%
    confidence: prob >= 0.15 ? 'high' : prob >= 0.05 ? 'medium' : 'low',
  }
}

/**
 * Project all award results for both players.
 * Uses odds data stored on the AppData (added by API update).
 */
export function projectAwards(
  aw: { Scott: AwardPicks; Ty: AwardPicks },
  awardsOdds: Record<string, Record<string, string>> // e.g. { "alMVP": { "Aaron Judge": "+200", ... } }
): { Scott: Record<string, AwardProjection>; Ty: Record<string, AwardProjection>; totals: { Scott: number; Ty: number } } {
  const categories = ['alMVP', 'nlMVP', 'alROY', 'nlROY', 'alCY', 'nlCY', 'alMGR', 'nlMGR']

  const result: { Scott: Record<string, AwardProjection>; Ty: Record<string, AwardProjection> } = {
    Scott: {},
    Ty: {},
  }

  const totals = { Scott: 0, Ty: 0 }

  for (const cat of categories) {
    for (const player of ['Scott', 'Ty'] as const) {
      const pickName = aw[player][cat as keyof AwardPicks] as string
      if (!pickName) {
        result[player][cat] = { result: 'none', points: 0, confidence: 'low' }
        continue
      }

      // Look up odds for this player's pick
      const catOdds = awardsOdds[cat] || {}
      const playerOdds = catOdds[pickName] || ''

      if (playerOdds) {
        result[player][cat] = projectFromOdds(playerOdds)
      } else {
        // No odds available — use a default based on award type
        // For CY Young, we already have projections via cyProjection.ts
        // For others, default to top10 if they're a reasonable pick
        result[player][cat] = {
          result: 'top10',
          points: 5,
          confidence: 'low',
        }
      }

      totals[player] += result[player][cat].points
    }
  }

  return { ...result, totals }
}

/**
 * Simple projection when no odds are available.
 * Uses a heuristic: favorites get "finalist", longshots get "top10".
 */
export function simpleProjection(pickName: string, isFavorite: boolean): AwardProjection {
  if (!pickName) return { result: 'none', points: 0, confidence: 'low' }
  if (isFavorite) return { result: 'finalist', points: 10, confidence: 'low' }
  return { result: 'top10', points: 5, confidence: 'low' }
}
