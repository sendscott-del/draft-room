import { useMemo } from 'react'
import type { PlayerProfile, UserAppData, AwardPicks } from '../types'
import { scoreAll, totalScore, type UserGameScores } from '../lib/scoring-per-user'
import { projectCYVotes } from '../lib/cyProjection'
import { projectAwards } from '../lib/awardsProjection'
import { GMETA, OUL } from '../data/constants'
import { COLORS } from '../data/constants'

const EMPTY_AWARDS: AwardPicks = {
  alMVP: '', nlMVP: '', alROY: '', nlROY: '', alCY: '', nlCY: '', alMGR: '', nlMGR: '',
  alMVPR: 'none', nlMVPR: 'none', alROYR: 'none', nlROYR: 'none',
  alCYR: 'none', nlCYR: 'none', alMGRR: 'none', nlMGRR: 'none',
}

type Row = { profile: PlayerProfile; picks: UserAppData | null }

interface Props {
  rows: Row[]
  myProfileId: string
  compareId: string | null
  onSelectCompare: (id: string) => void
}

// Note: not every show host participates in every game (only Trevor and Jake
// are full-time hosts). For hosts that skipped a game, their picks for that
// game will simply be empty arrays/objects and contribute 0 to their total.
// The per-game badges below the player name show which games they actually
// played — empty games are hidden, so it's visible at a glance who played
// what.
export default function MultiLeaderboard({ rows, myProfileId, compareId, onSelectCompare }: Props) {
  const scored = useMemo(() => {
    const playable = rows.filter(r => r.picks)

    // --- Field-wide projections (computed once across all rows) ---------------
    // CY votes are distributed across the field by relative odds + stats. We
    // project for each league using the union of every player's picks, then
    // each player gets credit for their own picks' projected vote totals.
    const allCYAL = playable.flatMap(r => (r.picks!.cy ?? []).filter(p => p.lg === 'AL'))
    const allCYNL = playable.flatMap(r => (r.picks!.cy ?? []).filter(p => p.lg === 'NL'))
    const cyAL = projectCYVotes(allCYAL)
    const cyNL = projectCYVotes(allCYNL)

    // Awards betting odds are global — replicated to each player's picks blob
    // by the stats updater (`data.awardsOdds`). Pull from any blob that has it.
    const awardsOdds: Record<string, Record<string, string>> =
      (playable.find(r => (r.picks as unknown as { awardsOdds?: unknown }).awardsOdds)
        ?.picks as unknown as { awardsOdds?: Record<string, Record<string, string>> })
        ?.awardsOdds ?? {}

    return playable
      .map(r => {
        const picks = r.picks!
        const actual = scoreAll(picks)

        // Projected CY votes for this user
        const projCY = (picks.cy ?? []).reduce((sum, p) => {
          const map = p.lg === 'AL' ? cyAL : cyNL
          return sum + (map.get(p.pitcher)?.projectedVotes ?? 0)
        }, 0)

        // Projected OU score using stored `projected` win totals
        const projOU = OUL.reduce((sum, t) => {
          const sl = picks.ou?.[t.a] as { pick?: string; projected?: number } | undefined
          if (!sl?.pick || sl.projected == null) return sum
          if ((sl.pick === 'over' && sl.projected > t.l) || (sl.pick === 'under' && sl.projected < t.l)) {
            return sum + 3
          }
          return sum
        }, 0)

        // Projected awards via the existing two-player projection helper
        let projAW = 0
        if (picks.aw && Object.keys(awardsOdds).length > 0) {
          const proj = projectAwards({ Scott: picks.aw, Ty: EMPTY_AWARDS }, awardsOdds)
          projAW = proj.totals.Scott
        }

        // Display: replace per-game zeros with projections where available
        const display: UserGameScores & { projected?: Partial<Record<keyof UserGameScores, true>> } = { ...actual }
        const projected: Partial<Record<keyof UserGameScores, true>> = {}
        if (actual.cy === 0 && projCY > 0) { display.cy = projCY; projected.cy = true }
        if (actual.ou === 0 && projOU > 0) { display.ou = projOU; projected.ou = true }
        if (actual.aw === 0 && projAW > 0) { display.aw = projAW; projected.aw = true }

        return {
          profile: r.profile,
          scores: display,
          total: totalScore(display),
          hasProj: Object.keys(projected).length > 0,
          projected,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [rows])

  const leaderTotal = scored[0]?.total ?? 0

  return (
    <>
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.cardBg}, rgba(0,0,0,0.2))`,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: '14px 16px',
        marginBottom: 18,
      }}>
        <div style={{ fontSize: 10, letterSpacing: 3, color: COLORS.muted2, textTransform: 'uppercase', marginBottom: 12, fontWeight: 700 }}>
          Standings — 2026 Season
        </div>

        {scored.length === 0 && (
          <div style={{ color: COLORS.muted, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
            No players yet.
          </div>
        )}

        {scored.map((r, i) => {
          const isMe = r.profile.id === myProfileId
          const isCompare = r.profile.id === compareId
          const isLeader = i === 0 && r.total > 0
          const rank = i + 1

          const bg = isMe
            ? 'rgba(34,197,94,0.10)'
            : isCompare
              ? 'rgba(59,130,246,0.10)'
              : 'rgba(255,255,255,0.02)'
          const border = isMe
            ? '1px solid rgba(34,197,94,0.4)'
            : isCompare
              ? '1px solid rgba(59,130,246,0.4)'
              : `1px solid ${COLORS.border}`

          return (
            <div
              key={r.profile.id}
              onClick={() => { if (!isMe) onSelectCompare(r.profile.id) }}
              style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr auto',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: bg,
                border,
                borderRadius: 10,
                marginBottom: 6,
                cursor: isMe ? 'default' : 'pointer',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 800, color: isLeader ? COLORS.gold : COLORS.muted2, fontFamily: 'monospace' }}>
                {isLeader ? '★' : `#${rank}`}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}>
                  {r.profile.display_name}
                  {r.profile.is_show_account && (
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, color: COLORS.gold, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '1px 6px' }}>
                      SHOW
                    </span>
                  )}
                  {isMe && (
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, color: '#22c55e', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '1px 6px' }}>
                      YOU
                    </span>
                  )}
                  {isCompare && !isMe && (
                    <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, color: '#3b82f6', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '1px 6px' }}>
                      COMPARING
                    </span>
                  )}
                </div>
                <PerGameBars scores={r.scores} max={leaderTotal} />
              </div>
              <div style={{
                fontSize: 22, fontWeight: 900, fontFamily: 'monospace',
                color: isLeader ? COLORS.gold : COLORS.text,
              }}>
                {r.hasProj ? '~' : ''}{r.total}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1, textAlign: 'center', marginTop: -8 }}>
        Click any other player to compare your picks against theirs.
      </div>
    </>
  )
}

function PerGameBars({ scores }: { scores: UserGameScores; max: number }) {
  const games: Array<keyof UserGameScores> = ['fa', 'cy', 'pu', 'hr', 'td', 'aw', 'ou']
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
      {games.map(g => {
        const meta = GMETA[g]
        const v = scores[g] || 0
        if (v <= 0) return null
        return (
          <span
            key={g}
            style={{
              fontSize: 9, fontFamily: 'monospace', color: meta.c,
              background: `${meta.c}18`, padding: '1px 5px', borderRadius: 4,
              fontWeight: 700,
            }}
            title={meta.l}
          >
            {meta.i} {Number.isInteger(v) ? v : v.toFixed(1)}
          </span>
        )
      })}
    </div>
  )
}
