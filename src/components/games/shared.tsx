import type { UserAppData, PlayerProfile } from '../../types'
import { COLORS } from '../../data/constants'

export interface PlayerView {
  profile: PlayerProfile
  picks: UserAppData
  isCurrentUser: boolean
}

export const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 4,
  color: COLORS.text,
  padding: '3px 6px',
  fontSize: 12,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export function SectionHeader({
  player, score, unit, color, editable, suffix,
}: {
  player: PlayerView
  score: number | string
  unit?: string
  color: string
  editable: boolean
  suffix?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 10px', marginBottom: 4, minHeight: 36, boxSizing: 'border-box',
      background: `${color}10`, border: `1px solid ${color}30`,
      borderRadius: 6, gap: 8, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <span style={{ fontWeight: 800, fontSize: 13, whiteSpace: 'nowrap' }}>{player.profile.display_name}</span>
        {player.isCurrentUser && (
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, color: '#5eb774', background: 'rgba(94,183,116,0.15)', border: '1px solid rgba(94,183,116,0.3)', borderRadius: 8, padding: '1px 5px' }}>YOU</span>
        )}
        {player.profile.is_show_account && (
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, color: COLORS.gold, background: 'rgba(232,181,74,0.15)', border: '1px solid rgba(232,181,74,0.3)', borderRadius: 8, padding: '1px 5px' }}>SHOW</span>
        )}
        {editable && (
          <span style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 1 }}>(editable)</span>
        )}
        {suffix}
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color }}>
        {score}{unit ? <span style={{ fontSize: 9, marginLeft: 3 }}>{unit}</span> : null}
      </div>
    </div>
  )
}

export function DidNotPlay({ names, game }: { names: string[]; game: string }) {
  if (names.length === 0) return null
  return (
    <div style={{
      marginTop: 18,
      padding: '8px 10px',
      borderRadius: 6,
      background: 'rgba(255,255,255,0.02)',
      border: '1px dashed rgba(255,255,255,0.09)',
      fontSize: 11,
      color: COLORS.muted2,
      fontStyle: 'italic',
    }}>
      Did not play {game}: {names.join(', ')}
    </div>
  )
}

export function sortPlayersForGame<T extends PlayerView & { score: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    if (a.isCurrentUser) return -1
    if (b.isCurrentUser) return 1
    return b.score - a.score
  })
}

export type EditMine = (fn: (mine: UserAppData) => UserAppData) => void

/** Horizontal-scrolling grid of player columns. Min 220 px per column so
 *  text stays legible; on a phone you swipe sideways to see more players. */
export function PlayerColumns({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridAutoFlow: 'column',
        gridAutoColumns: 'minmax(220px, 1fr)',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
        marginTop: 12,
        scrollSnapType: 'x proximity',
      }}
    >
      {children}
    </div>
  )
}
