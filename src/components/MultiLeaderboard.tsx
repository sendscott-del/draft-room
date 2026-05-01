import { useMemo } from 'react'
import type { PlayerProfile, UserAppData } from '../types'
import { computeScoredRows, type GameKey } from '../lib/leaderboard-scoring'
import { GMETA, COLORS } from '../data/constants'

type Row = { profile: PlayerProfile; picks: UserAppData | null }

interface Props {
  rows: Row[]
  myProfileId: string
  compareId: string | null
  onSelectCompare: (id: string) => void
}

// Awards is intentionally excluded from the Standings table — too volatile
// to display side-by-side. The Awards tab itself still shows each player's
// projection.
const GAME_ORDER: Exclude<GameKey, 'aw'>[] = ['fa', 'cy', 'pu', 'hr', 'td', 'ou', 'ps']

const SHORT_LABEL: Record<Exclude<GameKey, 'aw'>, string> = {
  fa: 'FA',
  cy: 'CY',
  pu: 'PU',
  hr: 'HR',
  td: 'TD',
  ou: 'O/U',
  ps: 'PS',
}

function fmtVal(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1)
}

export default function MultiLeaderboard({ rows, myProfileId }: Props) {
  const scored = useMemo(() => computeScoredRows(rows), [rows])

  const completeLeaderTotal = scored.find(r => r.totalIsComplete)?.total ?? 0

  return (
    <>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.cardBg}, rgba(0,0,0,0.2))`,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: '14px 6px 14px 14px',
        marginBottom: 18,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: COLORS.muted2, textTransform: 'uppercase', marginBottom: 12, fontWeight: 700, paddingRight: 8 }}>
          Standings — 2026 Season
        </div>

        {scored.length === 0 && (
          <div style={{ color: COLORS.muted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            No players yet.
          </div>
        )}

        {scored.length > 0 && (
          <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
            <table style={{
              borderCollapse: 'separate',
              borderSpacing: 0,
              width: '100%',
              minWidth: 640,
              fontSize: 12,
            }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: COLORS.bg, zIndex: 1, paddingLeft: 4 }}>Player</th>
                  {GAME_ORDER.map(g => (
                    <th key={g} style={{ ...thStyle, color: GMETA[g].c }} title={GMETA[g].l}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, lineHeight: 1.1 }}>
                        <span style={{ fontSize: 13 }}>{GMETA[g].i}</span>
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5 }}>{SHORT_LABEL[g]}</span>
                      </div>
                    </th>
                  ))}
                  <th style={{ ...thStyle, color: COLORS.gold, paddingRight: 4 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {scored.map((r, i) => {
                  const isMe = r.profile.id === myProfileId
                  const isLeader = i === 0 && r.totalIsComplete && r.total > 0
                  return (
                    <tr key={r.profile.id} style={{
                      background: isMe ? 'rgba(94,183,116,0.08)' : 'transparent',
                    }}>
                      <td style={{
                        ...tdStyle,
                        position: 'sticky', left: 0, zIndex: 1,
                        background: isMe ? 'rgba(15,28,46,0.98)' : COLORS.bg,
                        paddingLeft: 4,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, color: isLeader ? COLORS.gold : COLORS.muted2, fontFamily: 'monospace', fontWeight: 800, minWidth: 20 }}>
                            {isLeader ? '★' : r.totalIsComplete ? `#${i + 1}` : '—'}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {r.profile.display_name}
                          </span>
                          {r.profile.is_show_account && (
                            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, color: COLORS.gold, background: 'rgba(232,181,74,0.15)', border: '1px solid rgba(232,181,74,0.3)', borderRadius: 6, padding: '1px 4px' }}>SHOW</span>
                          )}
                          {isMe && (
                            <span style={{ fontSize: 7, fontWeight: 800, letterSpacing: 1, color: '#5eb774', background: 'rgba(94,183,116,0.15)', border: '1px solid rgba(94,183,116,0.3)', borderRadius: 6, padding: '1px 4px' }}>YOU</span>
                          )}
                        </div>
                      </td>
                      {GAME_ORDER.map(g => {
                        const played = r.played[g]
                        // PS isn't part of UserGameScores; show "✓" if played to indicate participation.
                        const score = g === 'ps'
                          ? (played ? '✓' : 'NA')
                          : played
                            ? fmtVal(r.scores[g as keyof typeof r.scores] || 0)
                            : 'NA'
                        const isProj = g !== 'ps' && r.projected[g as keyof typeof r.projected]
                        const color = !played
                          ? COLORS.muted
                          : isProj
                            ? '#5b8cc7'
                            : (g === 'ps' ? GMETA[g].c : ((r.scores[g as keyof typeof r.scores] || 0) > 0 ? GMETA[g].c : COLORS.muted))
                        return (
                          <td key={g} style={{ ...tdStyle, color, fontFamily: 'monospace', fontWeight: 700, textAlign: 'center' }}>
                            {isProj ? '~' : ''}{score}
                          </td>
                        )
                      })}
                      <td style={{
                        ...tdStyle,
                        textAlign: 'right',
                        paddingRight: 4,
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: 14,
                        color: !r.totalIsComplete ? COLORS.muted : isLeader ? COLORS.gold : COLORS.text,
                      }}>
                        {r.totalIsComplete
                          ? `${r.hasProj ? '~' : ''}${fmtVal(r.total)}`
                          : 'NA'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1, textAlign: 'center', padding: '0 12px', lineHeight: 1.6 }}>
        NA means a player skipped that game. A total only counts when every game has been played.
        {completeLeaderTotal > 0 && (
          <>
            <br />Top complete total: <span style={{ color: COLORS.gold }}>{fmtVal(completeLeaderTotal)}</span>
          </>
        )}
      </div>
    </>
  )
}

const thStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: COLORS.muted2,
  textAlign: 'center',
  padding: '6px 4px',
  borderBottom: `1px solid ${COLORS.border}`,
  letterSpacing: 1,
}

const tdStyle: React.CSSProperties = {
  padding: '8px 4px',
  borderBottom: `1px solid ${COLORS.border}`,
  whiteSpace: 'nowrap',
}
