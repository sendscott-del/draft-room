// Single source of truth for scored leaderboard rows. Used by both the
// Header banner and the Standings tab so they always agree.

import type { PlayerProfile, UserAppData, AwardPicks } from '../types'
import { scoreAll, totalScore, buildActualsMap, type UserGameScores } from './scoring-per-user'
import { buildCYPlacementMap } from './cyProjection'
import { projectAwards } from './awardsProjection'
import { derivePSOutcomes, hasEnoughOdds, scorePSAgainstOutcomes, type PlayoffOddsMap } from './psProjection'
import { OUL } from '../data/constants'

const EMPTY_AWARDS: AwardPicks = {
  alMVP: '', nlMVP: '', alROY: '', nlROY: '', alCY: '', nlCY: '', alMGR: '', nlMGR: '',
  alMVPR: 'none', nlMVPR: 'none', alROYR: 'none', nlROYR: 'none',
  alCYR: 'none', nlCYR: 'none', alMGRR: 'none', nlMGRR: 'none',
}

export type GameKey = 'fa' | 'cy' | 'pu' | 'hr' | 'td' | 'aw' | 'ou' | 'ps'

export interface ScoredRow {
  profile: PlayerProfile
  scores: UserGameScores
  played: Record<GameKey, boolean>
  /** Total of played games. `null` means "didn't play every game" so this row
   *  is shown but does not compete for the top of the standings. */
  total: number
  totalIsComplete: boolean
  hasProj: boolean
  projected: Partial<Record<keyof UserGameScores, true>>
}

export interface PlayerRow {
  profile: PlayerProfile
  picks: UserAppData | null
}

/** Did this player participate in a given game? Looks at their picks blob. */
export function didPlay(picks: UserAppData | null | undefined, game: GameKey): boolean {
  if (!picks) return false
  switch (game) {
    case 'fa': return (picks.fa?.length ?? 0) > 0
    case 'cy': return (picks.cy?.length ?? 0) > 0
    case 'pu': return (picks.pu?.length ?? 0) > 0
    case 'hr': return Object.values(picks.hr ?? {}).some(s => !!s?.p)
    case 'td': return (picks.td ?? []).some(p => !!p.player)
    case 'aw': return !!picks.aw && Object.entries(picks.aw).some(([k, v]) =>
      !k.endsWith('R') && typeof v === 'string' && v.length > 0
    )
    case 'ou': return Object.values(picks.ou ?? {}).some(v => !!v?.pick)
    case 'ps': {
      const ps = picks.ps
      if (!ps) return false
      if (ps.ws) return true
      if (ps.divisions && Object.values(ps.divisions).some(v => !!v)) return true
      if (ps.pennants && (ps.pennants.al || ps.pennants.nl)) return true
      if (ps.wildCards) {
        if ((ps.wildCards.al ?? []).some(v => !!v)) return true
        if ((ps.wildCards.nl ?? []).some(v => !!v)) return true
      }
      return false
    }
  }
}

/**
 * Build sorted, projection-aware scored rows for every player that has a
 * picks blob. Game-level projections are computed using the union of every
 * player's picks (the "field"), so totals are stable and don't shift when
 * the comparison player changes.
 */
export function computeScoredRows(rows: PlayerRow[]): ScoredRow[] {
  const playable = rows.filter(r => r.picks)

  // Field-wide CY placement map (1st 25 / 2nd 15 / 3rd 10 / 4th-5th 5
  // within each league). Built from actual votes when available, falls
  // back to projections during the season. Keeps CY on the same scale
  // as the rest of the games.
  const allCY = playable.flatMap(r => r.picks!.cy ?? [])
  const cyPlacements = buildCYPlacementMap(allCY)

  // Field-wide FA actuals: any player who has `actual` filled in becomes the
  // source of truth for that signing for every host that picked the same player.
  const actualsMap = buildActualsMap(playable.map(r => r.picks!))

  // Awards betting odds — replicated to each picks blob by the stats updater.
  const awardsOdds: Record<string, Record<string, string>> =
    (playable.find(r => (r.picks as unknown as { awardsOdds?: unknown }).awardsOdds)
      ?.picks as unknown as { awardsOdds?: Record<string, Record<string, string>> })
      ?.awardsOdds ?? {}

  // FG playoff probabilities — same replication pattern.
  const playoffOdds: PlayoffOddsMap | null =
    (playable.find(r => (r.picks as unknown as { playoffOdds?: unknown }).playoffOdds)
      ?.picks as unknown as { playoffOdds?: PlayoffOddsMap })
      ?.playoffOdds ?? null
  const psOutcomes = hasEnoughOdds(playoffOdds) ? derivePSOutcomes(playoffOdds!) : null

  return playable
    .map<ScoredRow>(r => {
      const picks = r.picks!
      const actual = scoreAll(picks, actualsMap, cyPlacements.map)

      const projOU = OUL.reduce((sum, t) => {
        const sl = picks.ou?.[t.a] as { pick?: string; projected?: number } | undefined
        if (!sl?.pick || sl.projected == null) return sum
        if ((sl.pick === 'over' && sl.projected > t.l) || (sl.pick === 'under' && sl.projected < t.l)) {
          return sum + 3
        }
        return sum
      }, 0)

      // Awards projection uses live betting odds when available, with a
      // preseason-favorites fallback when they're not. The previous version
      // gated the whole projection on having live odds, which meant the
      // forecast disappeared if the daily stats job hadn't replicated odds
      // into picks blobs yet.
      let projAW = 0
      if (picks.aw) {
        const proj = projectAwards({ Scott: picks.aw, Ty: EMPTY_AWARDS }, awardsOdds ?? {})
        projAW = proj.totals.Scott
      }

      // Postseason — purely projected. We have no "actual" stored on picks
      // until the season ends, but FG odds converge to 100/0 by then so the
      // projection becomes effectively the actual.
      const projPS = psOutcomes ? scorePSAgainstOutcomes(picks.ps, psOutcomes) : 0

      const display: UserGameScores = { ...actual }
      const projected: Partial<Record<keyof UserGameScores, true>> = {}
      // CY placement points may be derived from projected votes when no
      // actual votes are in yet — flag the score as projected in that case.
      if (cyPlacements.isProjection && actual.cy > 0) projected.cy = true
      if (actual.ou === 0 && projOU > 0) { display.ou = projOU; projected.ou = true }
      if (actual.aw === 0 && projAW > 0) { display.aw = projAW; projected.aw = true }
      if (projPS > 0) { display.ps = projPS; projected.ps = true }

      const played: Record<GameKey, boolean> = {
        fa: didPlay(picks, 'fa'),
        cy: didPlay(picks, 'cy'),
        pu: didPlay(picks, 'pu'),
        hr: didPlay(picks, 'hr'),
        td: didPlay(picks, 'td'),
        aw: didPlay(picks, 'aw'),
        ou: didPlay(picks, 'ou'),
        ps: didPlay(picks, 'ps'),
      }
      // Trade Deadline + Postseason happen later in the season — don't gate
      // the running total on those. Awards is excluded from the Standings
      // total entirely (still scored on its own tab) because award outcomes
      // are too volatile to drive the season-long leaderboard.
      const REQUIRED: GameKey[] = ['fa', 'cy', 'pu', 'hr', 'ou']
      const totalIsComplete = REQUIRED.every(g => played[g])

      // Standings total excludes AW; the Awards tab still shows it on its own.
      const standingsScores: UserGameScores = { ...display, aw: 0 }

      return {
        profile: r.profile,
        scores: display,
        played,
        total: totalScore(standingsScores),
        totalIsComplete,
        hasProj: Object.keys(projected).length > 0,
        projected,
      }
    })
    .sort((a, b) => {
      // Complete players first, ranked by total desc.
      // Incomplete players ("NA total") sort below, by their played-games total.
      if (a.totalIsComplete !== b.totalIsComplete) return a.totalIsComplete ? -1 : 1
      return b.total - a.total
    })
}
