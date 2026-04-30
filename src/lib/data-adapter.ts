import type { AppData, UserAppData, FAPickPersonal, TDPickPersonal } from '../types'
import { emptyUserPicks } from '../data/emptyPicks'

/**
 * Build a legacy `AppData` shape from two per-user pick blobs.
 * The current user always lands in the "Scott" slot, comparison player in "Ty".
 * This lets the existing two-player game components keep working unchanged.
 *
 * The comparison player's FA + TD round numbers are shifted to start after
 * the user's max round. This is because Scott + Ty's draft uses global
 * snake-draft rounds 1-32, while a show host's draft has its own per-host
 * round numbering (1-8). Without this shift the rounds would collide
 * visually.
 */
export function synthesizeLegacy(mine: UserAppData, theirs: UserAppData): AppData {
  const myFAPicks = mine.fa ?? []
  const myTDPicks = mine.td ?? []
  const myFAMax = myFAPicks.length === 0 ? 0 : Math.max(...myFAPicks.map(p => p.round))
  const myTDMax = myTDPicks.length === 0 ? 0 : Math.max(...myTDPicks.map(p => p.round))

  const myFA = myFAPicks.map(p => ({ ...p, owner: 'Scott' as const }))
  const theirFA = (theirs.fa ?? []).map((p, i) => {
    // Keep the comparison player's round if it doesn't collide; otherwise
    // shift them to start after the user's max round so display stays sensible.
    const collides = myFAPicks.some(mp => mp.round === p.round)
    const round = collides ? myFAMax + 1 + i : p.round
    return { ...p, round, owner: 'Ty' as const }
  })
  const myTD = myTDPicks.map(p => ({ ...p, owner: 'Scott' as const }))
  const theirTD = (theirs.td ?? []).map((p, i) => {
    const collides = myTDPicks.some(mp => mp.round === p.round)
    const round = collides ? myTDMax + 1 + i : p.round
    return { ...p, round, owner: 'Ty' as const }
  })

  return {
    fa: [...myFA, ...theirFA].sort((a, b) => a.round - b.round),
    td: [...myTD, ...theirTD].sort((a, b) => a.round - b.round),
    cy: { Scott: mine.cy ?? [], Ty: theirs.cy ?? [] },
    pu: { Scott: mine.pu ?? [], Ty: theirs.pu ?? [] },
    hr: { Scott: mine.hr ?? {}, Ty: theirs.hr ?? {} },
    aw: { Scott: mine.aw, Ty: theirs.aw },
    ou: { Scott: mine.ou ?? {}, Ty: theirs.ou ?? {} },
  }
}

/** Pull the current user's `UserAppData` back out of an edited legacy `AppData`. */
export function extractMine(legacy: AppData): UserAppData {
  const stripOwnerFA = (p: AppData['fa'][number]): FAPickPersonal => {
    const { owner: _o, ...rest } = p
    return rest
  }
  const stripOwnerTD = (p: AppData['td'][number]): TDPickPersonal => {
    const { owner: _o, ...rest } = p
    return rest
  }
  return {
    fa: legacy.fa.filter(p => p.owner === 'Scott').map(stripOwnerFA),
    td: legacy.td.filter(p => p.owner === 'Scott').map(stripOwnerTD),
    cy: legacy.cy.Scott ?? [],
    pu: legacy.pu.Scott ?? [],
    hr: legacy.hr.Scott ?? {},
    aw: legacy.aw.Scott,
    ou: legacy.ou.Scott ?? {},
  }
}

/** Returns true if a user's picks blob has any meaningful data. */
export function hasAnyPicks(p: UserAppData | null | undefined): boolean {
  if (!p) return false
  if ((p.fa?.length ?? 0) > 0) return true
  if ((p.cy?.length ?? 0) > 0) return true
  if ((p.pu?.length ?? 0) > 0) return true
  if (Object.keys(p.hr ?? {}).some(k => p.hr[k]?.p)) return true
  if ((p.td?.length ?? 0) > 0) return true
  if (Object.values(p.ou ?? {}).some(v => v?.pick)) return true
  if (p.aw && Object.values(p.aw).some(v => v && v !== 'none' && v !== '')) return true
  return false
}

/** Empty UserAppData fallback for players with no data yet. */
export const EMPTY_USER_PICKS: UserAppData = emptyUserPicks()
