/**
 * Projected Scores
 *
 * Calculates projected totals using forecasted data where actual results
 * aren't available yet. Uses CY Young vote projections and FanGraphs
 * projected wins to estimate final standings.
 */

import type { AppData } from '../types'
import { OUL, PLAYERS } from '../data/constants'
import { allScores } from './scoring'
import { projectPlayerTotal } from './cyProjection'

/**
 * Calculate projected O/U score using FanGraphs projected wins.
 * 3 pts per correct pick (same logic as actual, but using projected wins).
 */
function projectedOU(ou: AppData['ou']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => {
    OUL.forEach(t => {
      const sl = ou[p]?.[t.a]
      if (!sl?.pick) return
      const proj = (sl as any).projected as number | undefined
      if (proj == null) return
      if ((sl.pick === 'over' && proj > t.l) || (sl.pick === 'under' && proj < t.l)) {
        s[p] += 3
      }
    })
  })
  return s
}

/**
 * Get projected total scores.
 *
 * For each game:
 * - If actual score > 0, use actual
 * - If actual score = 0 and projection available, use projection
 * - Otherwise 0
 */
export function getProjectedTotals(data: AppData): {
  Scott: number; Ty: number
  breakdown: Record<string, { Scott: number; Ty: number; isProjected: boolean }>
} {
  const actual = allScores(data)

  // CY projections
  const cyProj = {
    Scott: projectPlayerTotal(data.cy, 'Scott'),
    Ty: projectPlayerTotal(data.cy, 'Ty'),
  }

  // O/U projections
  const ouProj = projectedOU(data.ou)

  const breakdown: Record<string, { Scott: number; Ty: number; isProjected: boolean }> = {}
  const games = ['fa', 'cy', 'pu', 'hr', 'td', 'aw', 'ou'] as const

  for (const g of games) {
    const act = actual[g]
    if (g === 'cy' && act.Scott === 0 && act.Ty === 0 && (cyProj.Scott > 0 || cyProj.Ty > 0)) {
      breakdown[g] = { Scott: cyProj.Scott, Ty: cyProj.Ty, isProjected: true }
    } else if (g === 'ou' && act.Scott === 0 && act.Ty === 0 && (ouProj.Scott > 0 || ouProj.Ty > 0)) {
      breakdown[g] = { Scott: ouProj.Scott, Ty: ouProj.Ty, isProjected: true }
    } else {
      breakdown[g] = { ...act, isProjected: false }
    }
  }

  const totals = { Scott: 0, Ty: 0 }
  for (const g of Object.values(breakdown)) {
    totals.Scott += g.Scott
    totals.Ty += g.Ty
  }

  return { ...totals, breakdown }
}
