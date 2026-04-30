// Single source of truth for scored leaderboard rows. Used by both the
// Header banner and the Standings tab so they always agree.

import type { PlayerProfile, UserAppData, AwardPicks } from '../types'
import { scoreAll, totalScore, type UserGameScores } from './scoring-per-user'
import { projectCYVotes } from './cyProjection'
import { projectAwards } from './awardsProjection'
import { OUL } from '../data/constants'

const EMPTY_AWARDS: AwardPicks = {
  alMVP: '', nlMVP: '', alROY: '', nlROY: '', alCY: '', nlCY: '', alMGR: '', nlMGR: '',
  alMVPR: 'none', nlMVPR: 'none', alROYR: 'none', nlROYR: 'none',
  alCYR: 'none', nlCYR: 'none', alMGRR: 'none', nlMGRR: 'none',
}

export interface ScoredRow {
  profile: PlayerProfile
  scores: UserGameScores
  total: number
  hasProj: boolean
  projected: Partial<Record<keyof UserGameScores, true>>
}

export interface PlayerRow {
  profile: PlayerProfile
  picks: UserAppData | null
}

/**
 * Build sorted, projection-aware scored rows for every player that has a
 * picks blob. Game-level projections are computed using the union of every
 * player's picks (the "field"), so totals are stable and don't shift when
 * the comparison player changes.
 */
export function computeScoredRows(rows: PlayerRow[]): ScoredRow[] {
  const playable = rows.filter(r => r.picks)

  // Field-wide CY projection across all rows
  const allCYAL = playable.flatMap(r => (r.picks!.cy ?? []).filter(p => p.lg === 'AL'))
  const allCYNL = playable.flatMap(r => (r.picks!.cy ?? []).filter(p => p.lg === 'NL'))
  const cyAL = projectCYVotes(allCYAL)
  const cyNL = projectCYVotes(allCYNL)

  // Awards betting odds — replicated to each picks blob by the stats updater.
  const awardsOdds: Record<string, Record<string, string>> =
    (playable.find(r => (r.picks as unknown as { awardsOdds?: unknown }).awardsOdds)
      ?.picks as unknown as { awardsOdds?: Record<string, Record<string, string>> })
      ?.awardsOdds ?? {}

  return playable
    .map<ScoredRow>(r => {
      const picks = r.picks!
      const actual = scoreAll(picks)

      const projCY = (picks.cy ?? []).reduce((sum, p) => {
        const map = p.lg === 'AL' ? cyAL : cyNL
        return sum + (map.get(p.pitcher)?.projectedVotes ?? 0)
      }, 0)

      const projOU = OUL.reduce((sum, t) => {
        const sl = picks.ou?.[t.a] as { pick?: string; projected?: number } | undefined
        if (!sl?.pick || sl.projected == null) return sum
        if ((sl.pick === 'over' && sl.projected > t.l) || (sl.pick === 'under' && sl.projected < t.l)) {
          return sum + 3
        }
        return sum
      }, 0)

      let projAW = 0
      if (picks.aw && Object.keys(awardsOdds).length > 0) {
        const proj = projectAwards({ Scott: picks.aw, Ty: EMPTY_AWARDS }, awardsOdds)
        projAW = proj.totals.Scott
      }

      const display: UserGameScores = { ...actual }
      const projected: Partial<Record<keyof UserGameScores, true>> = {}
      if (actual.cy === 0 && projCY > 0) { display.cy = projCY; projected.cy = true }
      if (actual.ou === 0 && projOU > 0) { display.ou = projOU; projected.ou = true }
      if (actual.aw === 0 && projAW > 0) { display.aw = projAW; projected.aw = true }

      return {
        profile: r.profile,
        scores: display,
        total: totalScore(display),
        hasProj: Object.keys(projected).length > 0,
        projected,
      }
    })
    .sort((a, b) => b.total - a.total)
}
