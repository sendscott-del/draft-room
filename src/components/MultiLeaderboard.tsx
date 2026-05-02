import { useMemo } from 'react'
import type { PlayerProfile, UserAppData } from '../types'
import { computeScoredRows, type GameKey } from '../lib/leaderboard-scoring'
import { GMETA, COLORS } from '../data/constants'
import GameInfo from './games/GameInfo'
import LowerThird from './ui/LowerThird'
import Badge from './ui/Badge'

type Row = { profile: PlayerProfile; picks: UserAppData | null }

interface Props {
  rows: Row[]
  myProfileId: string
  compareId: string | null
  onSelectCompare: (id: string) => void
}

// Awards lives at the end of the table and is intentionally NOT included
// in the running Total — award outcomes are too volatile to gate the
// season-long leaderboard on. The column is here for reference only.
const GAME_ORDER: GameKey[] = ['fa', 'cy', 'pu', 'hr', 'td', 'ou', 'ps', 'aw']

const SHORT_LABEL: Record<GameKey, string> = {
  fa: 'FA',
  cy: 'CY',
  pu: 'PU',
  hr: 'HR',
  td: 'TD',
  ou: 'O/U',
  ps: 'PS',
  aw: 'AW',
}

function fmtVal(n: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(1)
}

export default function MultiLeaderboard({ rows, myProfileId }: Props) {
  const scored = useMemo(() => computeScoredRows(rows), [rows])

  const completeLeaderTotal = scored.find(r => r.totalIsComplete)?.total ?? 0
  const playerCount = scored.length

  // Bar chart max for per-row sparklines
  const maxScore = useMemo(() => {
    let max = 1
    for (const r of scored) for (const g of GAME_ORDER) {
      const v = r.scores[g] || 0
      if (v > max) max = v
    }
    return max
  }, [scored])

  return (
    <>
      <LowerThird
        kicker={`The Standings · ${playerCount} player${playerCount === 1 ? '' : 's'} · 8 Games`}
        title="Who's On Top?"
        meta={
          <>
            <Badge variant="interim">Interim</Badge>
            <Badge variant="ghost" style={{ color: '#F2EAD3', borderColor: '#F2EAD3' }}>2026 Season</Badge>
          </>
        }
      />

      <GameInfo gameKey="lb" />

      {scored.length === 0 && (
        <div
          style={{
            background: '#E9DFC2',
            border: '1.5px solid #0E1B2C',
            padding: '28px 16px',
            textAlign: 'center',
            color: '#4A5466',
            fontFamily: "'Roboto Slab', serif",
            fontSize: 13,
            marginTop: 14,
          }}
        >
          No players yet.
        </div>
      )}

      {scored.length > 0 && (
        <div
          style={{
            background: '#F2EAD3',
            border: '1.5px solid #0E1B2C',
            boxShadow: '5px 5px 0 #0E1B2C',
            marginTop: 4,
            marginBottom: 18,
          }}
        >
          {scored.map((r, i) => {
            const isMe = r.profile.id === myProfileId
            const isLeader = i === 0 && r.totalIsComplete && r.total > 0
            return (
              <LBRow
                key={r.profile.id}
                rank={i + 1}
                row={r}
                isMe={isMe}
                isLeader={isLeader}
                isLast={i === scored.length - 1}
                maxScore={maxScore}
              />
            )
          })}
        </div>
      )}

      {/* Detail table — same data, denser, for stat-sheet readers */}
      {scored.length > 0 && (
        <div
          style={{
            background: '#E9DFC2',
            border: '1.5px solid #0E1B2C',
            padding: '14px 14px 6px',
            overflowX: 'auto',
            marginBottom: 14,
          }}
        >
          <div className="label" style={{ marginBottom: 10 }}>Game by Game</div>
          <table
            style={{
              borderCollapse: 'separate',
              borderSpacing: 0,
              width: '100%',
              minWidth: 640,
              fontSize: 12,
            }}
          >
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: 'left', position: 'sticky', left: 0, background: '#E9DFC2', zIndex: 1, paddingLeft: 4 }}>
                  Player
                </th>
                {GAME_ORDER.map(g => {
                  const isExcluded = g === 'aw'
                  return (
                    <th
                      key={g}
                      style={{ ...thStyle, color: GMETA[g].c, opacity: isExcluded ? 0.55 : 1 }}
                      title={`${GMETA[g].l}${isExcluded ? ' (not in total — reference only)' : ''}`}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, lineHeight: 1.1 }}>
                        <span className="label" style={{ fontSize: 11, letterSpacing: '0.14em' }}>{SHORT_LABEL[g]}</span>
                        {isExcluded && (
                          <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: '#6B7385', textTransform: 'uppercase' }}>ref</span>
                        )}
                      </div>
                    </th>
                  )
                })}
                <th style={{ ...thStyle, color: '#C8332C', paddingRight: 4 }}>
                  <span className="label" style={{ fontSize: 11, letterSpacing: '0.14em', color: '#C8332C' }}>Total</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {scored.map((r, i) => {
                const isMe = r.profile.id === myProfileId
                const isLeader = i === 0 && r.totalIsComplete && r.total > 0
                return (
                  <tr key={r.profile.id} style={{ background: isMe ? 'rgba(200,51,44,0.06)' : 'transparent' }}>
                    <td
                      style={{
                        ...tdStyle,
                        position: 'sticky', left: 0, zIndex: 1,
                        background: isMe ? '#EFE0BD' : '#E9DFC2',
                        paddingLeft: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className="mono"
                          style={{ fontSize: 11, color: isLeader ? '#C8332C' : '#4A5466', fontWeight: 700, minWidth: 22 }}
                        >
                          {isLeader ? '★' : r.totalIsComplete ? `#${i + 1}` : '—'}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Oswald', sans-serif",
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            fontSize: 14,
                            whiteSpace: 'nowrap',
                            color: '#0E1B2C',
                          }}
                        >
                          {r.profile.display_name}
                        </span>
                        {r.profile.is_show_account && <Badge variant="gold" style={{ fontSize: 8, padding: '1px 5px' }}>Show</Badge>}
                        {isMe && <Badge variant="red" style={{ fontSize: 8, padding: '1px 5px' }}>You</Badge>}
                      </div>
                    </td>
                    {GAME_ORDER.map(g => {
                      const played = r.played[g]
                      const val = r.scores[g] || 0
                      const score = played ? fmtVal(val) : 'NA'
                      const isProj = !!r.projected[g]
                      const isExcluded = g === 'aw'
                      const color = !played
                        ? '#6B7385'
                        : isProj
                          ? '#1E4A6B'
                          : (val > 0 ? GMETA[g].c : '#6B7385')
                      return (
                        <td
                          key={g}
                          className="mono"
                          style={{
                            ...tdStyle,
                            color,
                            fontWeight: 700,
                            textAlign: 'center',
                            opacity: isExcluded ? 0.55 : 1,
                            fontStyle: isExcluded ? 'italic' : 'normal',
                          }}
                        >
                          {played && isProj ? '~' : ''}{score}
                        </td>
                      )
                    })}
                    <td
                      className="mono"
                      style={{
                        ...tdStyle,
                        textAlign: 'right',
                        paddingRight: 4,
                        fontWeight: 800,
                        fontSize: 14,
                        color: !r.totalIsComplete ? '#6B7385' : isLeader ? '#C8332C' : '#0E1B2C',
                      }}
                    >
                      {r.totalIsComplete ? `${r.hasProj ? '~' : ''}${fmtVal(r.total)}` : 'NA'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div
        className="serif"
        style={{
          fontSize: 12,
          color: '#4A5466',
          textAlign: 'center',
          padding: '0 12px',
          lineHeight: 1.6,
        }}
      >
        Total = FA + CY + PU + HR + TD + O/U + PS. <span style={{ opacity: 0.7 }}><em>AW</em> is shown for reference only and isn't in the total.</span>
        <br />NA means a player skipped that game.
        {completeLeaderTotal > 0 && (
          <>
            <br />Top complete total: <span style={{ color: '#C8332C', fontWeight: 700 }}>{fmtVal(completeLeaderTotal)}</span>
          </>
        )}
      </div>
    </>
  )
}

function LBRow({
  rank, row, isMe, isLeader, isLast, maxScore,
}: {
  rank: number
  row: ReturnType<typeof computeScoredRows>[number]
  isMe: boolean
  isLeader: boolean
  isLast: boolean
  maxScore: number
}) {
  const games = (['fa','cy','pu','hr','td','ou','ps','aw'] as GameKey[])

  // Per-row delta — points from games marked as projected (the "since last
  // update" hint, approximated as the projected portion of the total).
  const projTotal = games.reduce((acc, g) => acc + (row.projected[g] ? (row.scores[g] || 0) : 0), 0)
  const delta = row.hasProj ? `~${fmtVal(projTotal)} pending` : ''
  const completeStr = `${games.filter(g => row.played[g]).length} of 8 games scored`

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 1fr 140px 80px 110px',
        alignItems: 'center',
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid #DCCFAA',
        gap: 12,
        position: 'relative',
        background: isLeader ? 'linear-gradient(90deg, rgba(212,162,76,0.22), transparent 65%)' : 'transparent',
      }}
    >
      {isMe && (
        <div
          aria-hidden
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: '#C8332C' }}
        />
      )}

      {/* Rank */}
      <div style={{ textAlign: 'center' }}>
        {isLeader && (
          <div
            className="label"
            style={{ color: '#C8332C', fontSize: 10, letterSpacing: '0.18em', marginBottom: 2 }}
          >
            ★ Leader
          </div>
        )}
        <div
          className="brand-display"
          style={{
            fontSize: 30,
            color: isLeader ? '#C8332C' : '#0E1B2C',
            lineHeight: 1,
          }}
        >
          {String(rank).padStart(2, '0')}
        </div>
      </div>

      {/* Name */}
      <div style={{ minWidth: 0 }}>
        <div
          className="brand-display"
          style={{
            fontSize: 22,
            letterSpacing: '0.04em',
            color: '#0E1B2C',
            lineHeight: 1.05,
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {row.profile.display_name}
          </span>
          {isMe && (
            <span
              className="script-italic"
              style={{ fontSize: 12, color: '#C8332C', textTransform: 'none', letterSpacing: 0, fontWeight: 500 }}
            >
              — you
            </span>
          )}
          {row.profile.is_show_account && (
            <Badge variant="gold" style={{ fontSize: 9, padding: '1px 6px' }}>Show</Badge>
          )}
        </div>
        <div
          className="mono"
          style={{ fontSize: 11, color: '#4A5466', marginTop: 4 }}
        >
          {completeStr}
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 26 }}>
        {games.map(g => {
          const v = row.scores[g] || 0
          const played = row.played[g]
          const h = Math.max(4, Math.round((v / maxScore) * 24))
          const isHighest = v > 0 && v === Math.max(...games.map(gg => row.scores[gg] || 0))
          return (
            <div
              key={g}
              title={`${SHORT_LABEL[g]}: ${played ? fmtVal(v) : 'NA'}`}
              style={{
                width: 7,
                height: played ? h : 6,
                background: !played ? '#DCCFAA' : isHighest ? '#C8332C' : '#0E1B2C',
                opacity: !played ? 1 : 0.85,
              }}
            />
          )
        })}
      </div>

      {/* Delta */}
      <div
        className="mono"
        style={{
          fontSize: 12,
          fontWeight: 700,
          textAlign: 'right',
          color: row.hasProj ? '#A77A2C' : '#4F6B3F',
        }}
      >
        {delta || '—'}
      </div>

      {/* Total */}
      <div style={{ textAlign: 'right' }}>
        <div
          className="brand-display"
          style={{
            fontSize: 36,
            lineHeight: 1,
            color: isLeader ? '#C8332C' : '#0E1B2C',
          }}
        >
          {row.totalIsComplete ? `${row.hasProj ? '~' : ''}${fmtVal(row.total)}` : 'NA'}
        </div>
        <div
          className="label"
          style={{ fontSize: 10, color: '#4A5466', marginTop: 3, letterSpacing: '0.18em' }}
        >
          Points
        </div>
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#4A5466',
  textAlign: 'center',
  padding: '6px 4px',
  borderBottom: `1.5px solid #0E1B2C`,
  letterSpacing: '0.14em',
  fontFamily: "'Oswald', sans-serif",
  textTransform: 'uppercase',
}

const tdStyle: React.CSSProperties = {
  padding: '8px 4px',
  borderBottom: `1px solid ${COLORS.borderSoft}`,
  whiteSpace: 'nowrap',
}
