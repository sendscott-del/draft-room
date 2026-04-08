import type { AppData } from '../types'
import type { CountdownState } from '../lib/locks'
import { allScores, getTotals } from '../lib/scoring'
import SyncDot from './ui/SyncDot'
import Countdown from './ui/Countdown'

interface HeaderProps {
  data: AppData
  syncStatus: 'loading' | 'saved' | 'saving' | 'error'
  countdown: CountdownState
}

export default function Header({ data, syncStatus, countdown }: HeaderProps) {
  const sc = allScores(data)
  const tot = getTotals(sc)
  const leader = tot.Scott > tot.Ty ? 'Scott' : tot.Ty > tot.Scott ? 'Ty' : null
  const sCol = leader === 'Scott' ? '#fbbf24' : '#f1f5f9'
  const tCol = leader === 'Ty' ? '#fbbf24' : '#f1f5f9'

  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 9, letterSpacing: 4, color: '#64748b', textTransform: 'uppercase', marginBottom: 1 }}>
            2026 Season
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.5 }}>
            {'\u26BE'} The Draft Room
          </div>
          <SyncDot status={syncStatus} />
        </div>
        <Countdown state={countdown} />
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, color: sCol }}>
              {tot.Scott}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#64748b' }}>SCOTT</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'monospace', lineHeight: 1, color: tCol }}>
              {tot.Ty}
            </div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: '#64748b' }}>TY</div>
          </div>
        </div>
      </div>
    </div>
  )
}
