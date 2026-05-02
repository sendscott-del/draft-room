import { useAuth } from '../lib/auth-context'
import BroadcastBar from './ui/BroadcastBar'
import Badge from './ui/Badge'

interface Props {
  selectedSeason: number | null
  currentSeason: number | null
  availableSeasons: number[]
  onSelectSeason: (s: number) => void
}

/** Studio Talk top broadcast bar — replaces the old user bar. Shows the
 *  signed-in user, season selector, and read-only state in the same
 *  navy/red broadcast strip used by the design system. */
export default function UserBar({ selectedSeason, currentSeason, availableSeasons, onSelectSeason }: Props) {
  const { profile, session, signOut } = useAuth()
  const name = profile?.display_name ?? session?.user?.email ?? 'Signed in'
  const isPastSeason = currentSeason != null && selectedSeason != null && selectedSeason !== currentSeason
  const seasons = availableSeasons.length > 0 ? availableSeasons : (currentSeason != null ? [currentSeason] : [])

  return (
    <BroadcastBar
      live
      status={
        <span style={{ display: 'inline-flex', gap: 14, alignItems: 'center' }}>
          <span>Spring Training · 2026</span>
          <span style={{ opacity: 0.35 }}>/</span>
          <span style={{ color: '#D4A24C' }}>Studio Edition</span>
        </span>
      }
      right={
        <>
          {seasons.length > 0 && selectedSeason != null && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 10,
                color: 'rgba(242,234,211,0.75)',
                letterSpacing: '0.16em',
              }}
            >
              Season
              <select
                value={selectedSeason}
                onChange={e => onSelectSeason(parseInt(e.target.value, 10))}
                style={{
                  background: '#0E1B2C',
                  border: '1.5px solid #F2EAD3',
                  borderRadius: 0,
                  color: '#F2EAD3',
                  padding: '2px 6px',
                  fontFamily: "'Oswald', sans-serif",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  outline: 'none',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                {seasons.map(s => (
                  <option key={s} value={s}>{s}{s === currentSeason ? ' (current)' : ''}</option>
                ))}
              </select>
            </label>
          )}
          {isPastSeason && <Badge variant="gold">Read-only</Badge>}
          <span style={{ opacity: 0.5 }}>{name}</span>
          {profile?.is_show_account && <Badge variant="gold">Show</Badge>}
          <button
            onClick={signOut}
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(242,234,211,0.4)',
              borderRadius: 0,
              color: 'rgba(242,234,211,0.85)',
              fontFamily: "'Oswald', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 10px',
              cursor: 'pointer',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Sign out
          </button>
        </>
      }
    />
  )
}
