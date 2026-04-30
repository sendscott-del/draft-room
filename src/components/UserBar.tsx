import { useAuth } from '../lib/auth-context'
import { COLORS } from '../data/constants'

interface Props {
  selectedSeason: number | null
  currentSeason: number | null
  availableSeasons: number[]
  onSelectSeason: (s: number) => void
}

export default function UserBar({ selectedSeason, currentSeason, availableSeasons, onSelectSeason }: Props) {
  const { profile, session, signOut } = useAuth()
  const name = profile?.display_name ?? session?.user?.email ?? 'Signed in'
  const isPastSeason = currentSeason != null && selectedSeason != null && selectedSeason !== currentSeason
  const seasons = availableSeasons.length > 0 ? availableSeasons : (currentSeason != null ? [currentSeason] : [])

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.4)',
        borderBottom: `1px solid ${COLORS.border}`,
        padding: '6px 16px',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 11, color: COLORS.muted2, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{'\u{1F464}'} {name}</span>
          {profile?.is_show_account && (
            <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(232,181,74,0.15)', color: COLORS.gold, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>
              SHOW
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {seasons.length > 0 && selectedSeason != null && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: COLORS.muted2, letterSpacing: 1 }}>
              SEASON
              <select
                value={selectedSeason}
                onChange={e => onSelectSeason(parseInt(e.target.value, 10))}
                style={{
                  background: '#1e293b', border: `1px solid ${COLORS.border}`,
                  borderRadius: 4, color: COLORS.text, padding: '2px 6px',
                  fontSize: 11, fontWeight: 800, outline: 'none', cursor: 'pointer',
                }}
              >
                {seasons.map(s => (
                  <option key={s} value={s}>{s}{s === currentSeason ? ' (current)' : ''}</option>
                ))}
              </select>
            </label>
          )}
          {isPastSeason && (
            <span style={{ padding: '2px 7px', borderRadius: 4, background: 'rgba(232,181,74,0.15)', border: '1px solid rgba(232,181,74,0.4)', color: COLORS.gold, fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>
              READ-ONLY
            </span>
          )}
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: `1px solid ${COLORS.border}`,
              borderRadius: 4,
              color: COLORS.muted2,
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            SIGN OUT
          </button>
        </div>
      </div>
    </div>
  )
}
