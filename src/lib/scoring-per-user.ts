// Per-user scoring — operates on `UserAppData` (no Scott/Ty nesting).
import type { UserAppData, FAPickPersonal, AwardResult } from '../types'
import { OUL } from '../data/constants'
import { parseActual } from './scoring'

const AWARD_PTS: Record<AwardResult, number> = {
  winner: 25, finalist: 10, top10: 5, none: 0,
}

const AWARD_RESULT_KEYS = ['alMVPR','nlMVPR','alROYR','nlROYR','alCYR','nlCYR','alMGRR','nlMGRR'] as const

/**
 * Score a player's free agent picks. `actualsMap` lets the caller supply a
 * shared "what each player actually signed for" lookup keyed by player name —
 * because the same signing is the same fact regardless of who drafted them,
 * and only Scott/Ty's picks were originally seeded with `actual` strings.
 * Falls back to `pick.actual` if the map has no entry.
 */
export function scoreFA(picks: FAPickPersonal[], actualsMap?: Map<string, string>): number {
  let total = 0
  const seen = new Set<string>()
  const sorted = [...picks].sort((a, b) => a.round - b.round)
  for (const p of sorted) {
    const actualStr = (actualsMap?.get(p.player) || p.actual || '').trim()
    const ac = parseActual(actualStr)
    const at = ac.team
    const ay = ac.years
    const tc = !!(at && p.team && at === p.team)
    let pts = 0
    if (tc) {
      pts += p.newTeam ? 10 : 5
      if (p.award || p.asg) pts += 5
      if (p.round > 24) pts += 5
      if (p.round >= 26 && !seen.has(at!)) pts += 5
    }
    const py = p.years ? parseInt(p.years) : null
    if (py && ay && py === ay) pts += 5
    if (p.player && pts > 0) total += pts
    if (at) seen.add(at)
  }
  return total
}

/** Build a player-name → actual-signing map from every player's FA picks. */
export function buildActualsMap(allPlayerPicks: Array<{ fa?: FAPickPersonal[] }>): Map<string, string> {
  const map = new Map<string, string>()
  for (const u of allPlayerPicks) {
    for (const p of u.fa ?? []) {
      if (!p.player || !p.actual) continue
      const existing = map.get(p.player)
      if (!existing) map.set(p.player, p.actual)
    }
  }
  return map
}

export function scoreCY(picks: UserAppData['cy']): number {
  return picks.reduce((acc, x) => acc + (Number(x.votes) || 0), 0)
}

export function scorePU(picks: UserAppData['pu']): number {
  return picks.reduce((acc, x) => acc + (Number(x.war) || 0), 0)
}

export function scoreHR(slots: UserAppData['hr']): number {
  return Object.values(slots).reduce((acc, x) => acc + (Number(x?.hr) || 0), 0)
}

export function scoreTD(picks: UserAppData['td']): number {
  let total = 0
  for (const p of picks) {
    if (!p.player) continue
    let pts = p.team ? 10 : 0
    if (p.traded) pts += 5
    if (p.asg || p.award) pts += 5
    total += pts
  }
  return total
}

export function scoreAW(aw: UserAppData['aw']): number {
  if (!aw) return 0
  return AWARD_RESULT_KEYS.reduce((acc, k) => acc + (AWARD_PTS[aw[k] as AwardResult] || 0), 0)
}

export function scoreOU(ou: UserAppData['ou']): number {
  const seasonOver = new Date() >= new Date('2026-09-28T03:59:59Z')
  let total = 0
  for (const t of OUL) {
    const sl = ou?.[t.a] as { pick?: string; actual?: string; projected?: number } | undefined
    if (!sl?.pick) continue
    let compareVal: number | null = null
    if (seasonOver && sl.actual) compareVal = Number(sl.actual)
    else if (sl.projected != null) compareVal = Number(sl.projected)
    if (compareVal == null) continue
    if ((sl.pick === 'over' && compareVal > t.l) || (sl.pick === 'under' && compareVal < t.l)) {
      total += 3
    }
  }
  return total
}

export interface UserGameScores {
  fa: number
  cy: number
  pu: number
  hr: number
  td: number
  aw: number
  ou: number
  ps: number
}

export function scoreAll(picks: UserAppData, actualsMap?: Map<string, string>): UserGameScores {
  return {
    fa: scoreFA(picks.fa ?? [], actualsMap),
    cy: scoreCY(picks.cy ?? []),
    pu: scorePU(picks.pu ?? []),
    hr: scoreHR(picks.hr ?? {}),
    td: scoreTD(picks.td ?? []),
    aw: scoreAW(picks.aw),
    ou: scoreOU(picks.ou ?? {}),
    ps: 0, // PS has no "actual" — it's purely projected from FG odds in leaderboard-scoring.
  }
}

export function totalScore(s: UserGameScores): number {
  const t = s.fa + s.cy + s.pu + s.hr + s.td + s.aw + s.ou + s.ps
  return Number.isInteger(t) ? t : parseFloat(t.toFixed(1))
}
