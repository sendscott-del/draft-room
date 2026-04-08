import type { AppData, FAPick } from '../types'
import { OUL } from '../data/constants'

const PLAYERS = ['Scott', 'Ty'] as const

export function parseActual(a: string): { years: number | null; team: string | null } {
  if (!a) return { years: null, team: null }
  const p = a.trim().split(' ')
  return { years: p[0] ? parseInt(p[0]) : null, team: p[1] || null }
}

export function scoreOnePick(pick: FAPick, seen: Set<string>): { pts: number; breakdown: string[] } {
  const ac = parseActual(pick.actual)
  const actualTeam = ac.team
  const actualYears = ac.years
  const pickedTeam = pick.team
  const pickedYears = pick.years ? parseInt(pick.years) : null
  const tc = !!(actualTeam && pickedTeam && actualTeam === pickedTeam)
  const bd: string[] = []
  let pts = 0

  if (tc) {
    const base = pick.newTeam ? 10 : 5
    pts += base
    bd.push((pick.newTeam ? 'New team' : 'Re-sign') + ' +' + base)
    if (pick.award || pick.asg) { pts += 5; bd.push('Award/ASG +5') }
    if (pick.round > 24) { pts += 5; bd.push('After R24 +5') }
    if (pick.round >= 26 && !seen.has(actualTeam!)) { pts += 5; bd.push('Unused team +5') }
  }
  if (pickedYears && actualYears && pickedYears === actualYears) { pts += 5; bd.push('Contract +5') }

  return { pts, breakdown: bd }
}

export function sFA(fa: FAPick[]): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  const seen = new Set<string>()
  fa.forEach(p => {
    const ac = parseActual(p.actual)
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
    if (p.player && pts > 0) s[p.owner] = (s[p.owner] || 0) + pts
    if (at) seen.add(at)
  })
  return s
}

export function sCY(cy: AppData['cy']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => { cy[p].forEach(x => { s[p] += Number(x.votes) || 0 }) })
  return s
}

export function sPU(pu: AppData['pu']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => { pu[p].forEach(x => { s[p] += Number(x.war) || 0 }) })
  return s
}

export function sHR(hr: AppData['hr']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => { Object.values(hr[p]).forEach(x => { s[p] += Number(x.hr) || 0 }) })
  return s
}

export function sTD(td: AppData['td']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  td.forEach(p => {
    if (!p.player) return
    let pts = p.team ? 10 : 0
    if (p.traded) pts += 5
    if (p.asg || p.award) pts += 5
    s[p.owner] = (s[p.owner] || 0) + pts
  })
  return s
}

export function sAW(aw: AppData['aw']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  const pts: Record<string, number> = { winner: 25, finalist: 10, top10: 5, none: 0 }
  PLAYERS.forEach(p => {
    (['alMVPR', 'nlMVPR', 'alROYR', 'nlROYR', 'alCYR', 'nlCYR', 'alMGRR', 'nlMGRR'] as const).forEach(k => {
      s[p] += pts[aw[p][k]] || 0
    })
  })
  return s
}

export function sOU(ou: AppData['ou']): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  PLAYERS.forEach(p => {
    OUL.forEach(t => {
      const sl = ou[p][t.a]
      if (!sl || !sl.pick || !sl.actual) return
      const a = Number(sl.actual)
      if ((sl.pick === 'over' && a > t.l) || (sl.pick === 'under' && a < t.l)) s[p] += 3
    })
  })
  return s
}

export function allScores(d: AppData) {
  return { fa: sFA(d.fa), cy: sCY(d.cy), pu: sPU(d.pu), hr: sHR(d.hr), td: sTD(d.td), aw: sAW(d.aw), ou: sOU(d.ou) }
}

export function getTotals(sc: ReturnType<typeof allScores>): { Scott: number; Ty: number } {
  const s = { Scott: 0, Ty: 0 }
  Object.values(sc).forEach(g => { s.Scott += g.Scott || 0; s.Ty += g.Ty || 0 })
  return { Scott: parseFloat(s.Scott.toFixed(1)), Ty: parseFloat(s.Ty.toFixed(1)) }
}

export function fmt(n: number): number {
  return Number.isInteger(n) ? n : parseFloat(n.toFixed(1))
}
