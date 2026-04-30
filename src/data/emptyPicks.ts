import type { UserAppData, AwardPicks, OUPick, HRSlot } from '../types'
import { OUL } from './constants'

const EMPTY_AWARDS: AwardPicks = {
  alMVP: '', nlMVP: '', alROY: '', nlROY: '',
  alCY: '',  nlCY: '',  alMGR: '', nlMGR: '',
  alMVPR: 'none', nlMVPR: 'none',
  alROYR: 'none', nlROYR: 'none',
  alCYR: 'none',  nlCYR: 'none',
  alMGRR: 'none', nlMGRR: 'none',
}

const HR_SLOTS = ['C', '1B', '2B', '3B', 'SS', 'RF', 'CF', 'LF', 'DH'] as const

function emptyHR(): Record<string, HRSlot> {
  return Object.fromEntries(HR_SLOTS.map(slot => [slot, { p: '', t: '', hr: 0 }]))
}

function emptyOU(): Record<string, OUPick> {
  const out: Record<string, OUPick> = {}
  for (const { a } of OUL) {
    out[a] = { pick: '', actual: '' }
  }
  return out
}

/** Default empty picks for a brand-new user — everything blank, all defaults. */
export function emptyUserPicks(): UserAppData {
  return {
    fa: [],
    cy: [],
    pu: [],
    hr: emptyHR(),
    td: [],
    aw: { ...EMPTY_AWARDS },
    ou: emptyOU(),
    ps: {},
  }
}
