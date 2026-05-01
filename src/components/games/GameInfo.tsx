import InfoPopup from '../ui/InfoPopup'
import { COLORS, GMETA } from '../../data/constants'

type Key = keyof typeof GMETA | 'lb'

const listStyle: React.CSSProperties = {
  margin: '6px 0',
  paddingLeft: 18,
  display: 'grid',
  gap: 4,
}

const SCORING: Record<Key, React.ReactNode> = {
  fa: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong></p>
      <ul style={listStyle}>
        <li>Team correct + new team: <strong>+10</strong></li>
        <li>Team correct + re-sign: <strong>+5</strong></li>
        <li>Contract length match (any team): <strong>+5</strong></li>
        <li>Team correct + prior CY/MVP/RoY or 2026 All-Star: <strong>+5</strong></li>
        <li>Team correct + round &gt; 24: <strong>+5</strong></li>
        <li>Team correct + round ≥ 26 + actual team unused: <strong>+5</strong></li>
      </ul>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Source:</strong> the actual signing for each player is shared field-wide — once anyone has the "→ 5yr LAD" string filled in, every host who picked the same player gets credit.</p>
    </>
  ),
  cy: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong> — placement-based per league.</p>
      <ul style={listStyle}>
        <li>1st in votes (or projected votes): <strong>25 pts</strong></li>
        <li>2nd: <strong>15 pts</strong></li>
        <li>3rd: <strong>10 pts</strong></li>
        <li>4th–5th: <strong>5 pts</strong></li>
      </ul>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Forecast methodology</strong></p>
      <p>Projection blends sportsbook odds (implied probability) with current pitching stats (ERA, K/9, W-L, IP). Early in the season the model leans on odds; as IP accumulates it shifts toward stats. Votes are distributed across the field using a curve calibrated from 2025 BBWAA results, then converted to the placement points above.</p>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Sources:</strong> MLB Stats API (pitcher stats), The Odds API (CY betting odds).</p>
    </>
  ),
  pu: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong> — total WAR across your 4 drafted units.</p>
      <p>Each pick is one team-position group (e.g. Yankees OF). Score is the sum of WAR from every player at that team + position type during the season.</p>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Source:</strong> FanGraphs leaderboards (batting + pitching WAR), refreshed by the daily stats job.</p>
    </>
  ),
  hr: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong> — total HRs hit by your 9-position lineup.</p>
      <p>One player per position (C / 1B / 2B / 3B / SS / LF / CF / RF / DH). Once a team is drafted by anyone, that team is gone for everyone (any-team-once rule).</p>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Source:</strong> MLB Stats API season-stats endpoint per player.</p>
    </>
  ),
  td: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong></p>
      <ul style={listStyle}>
        <li>Filled in (any team): <strong>+10</strong></li>
        <li>Player actually traded: <strong>+5</strong></li>
        <li>2027 All-Star or prior CY/MVP/RoY: <strong>+5</strong></li>
      </ul>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Source:</strong> entered manually after the trade deadline (Aug 3, 6 pm ET).</p>
    </>
  ),
  aw: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong></p>
      <ul style={listStyle}>
        <li>Winner: <strong>25 pts</strong></li>
        <li>Top 3 finalist: <strong>10 pts</strong></li>
        <li>Top 10: <strong>5 pts</strong></li>
        <li>Outside top 10: <strong>0 pts</strong></li>
      </ul>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Forecast methodology</strong></p>
      <p>Live betting odds are converted to implied probability and mapped to projected finish — &gt;40% = winner, 15-40% = top 3, 5-15% = top 10, &lt;5% = none. When live odds aren't available, the projection falls back to a preseason-favorites list.</p>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Note:</strong> Awards points are shown for reference but do not roll into the Standings total.</p>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Sources:</strong> The Odds API (MVP / RoY / CY / Manager outright markets).</p>
    </>
  ),
  ou: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong> — 3 pts per correct over/under.</p>
      <p>You pick over or under for each team's projected win total. During the season, picks are scored against FanGraphs' projected end-of-season wins. After the season ends, picks are scored against actual win totals.</p>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Sources:</strong> FanGraphs playoff odds (projected wins) and MLB Stats API (final standings).</p>
    </>
  ),
  ps: (
    <>
      <p><strong style={{ color: COLORS.text }}>How it scores</strong></p>
      <ul style={listStyle}>
        <li>Each correct division winner: <strong>+5</strong> (× 6 = 30)</li>
        <li>Each correct wild card (any slot): <strong>+3</strong> (× 6 = 18)</li>
        <li>AL pennant correct: <strong>+10</strong></li>
        <li>NL pennant correct: <strong>+10</strong></li>
        <li>World Series champion: <strong>+25</strong></li>
      </ul>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Forecast methodology</strong></p>
      <p>Projection uses FanGraphs per-team probabilities — division winner = top <code>divTitle</code> per division, wild cards = top three <code>wcTitle</code> non-division-leaders per league, pennants = top <code>csWin</code> per league, World Series = top <code>wsWin</code> overall. As the season progresses the probabilities converge to 1 / 0, so the projection becomes the actual.</p>
      <p style={{ marginTop: 10 }}><strong style={{ color: COLORS.text }}>Source:</strong> FanGraphs playoff odds API.</p>
    </>
  ),
  lb: (
    <>
      <p><strong style={{ color: COLORS.text }}>How the table works</strong></p>
      <p>Each row is a player; each column is a game. Cells show that player's score for that game (or <strong>NA</strong> if they didn't play it).</p>
      <p style={{ marginTop: 10 }}>The <strong>Total</strong> column sums every game except <em>Trade Deadline</em>, <em>Postseason</em>, and <em>Awards</em>. TD + PS happen later in the season; AW is too volatile to drive the season-long leaderboard.</p>
      <p style={{ marginTop: 10 }}>A <strong>~</strong> prefix on a cell or total means the score includes a forecast (CY votes, OU projected wins, postseason probabilities, or award odds).</p>
      <p style={{ marginTop: 10 }}>Players who haven't played every required game show <strong>NA</strong> as their total — they're listed below ranked players so they don't compete for #1 without a complete slate.</p>
    </>
  ),
}

export default function GameInfo({ gameKey }: { gameKey: Key }) {
  const meta = gameKey === 'lb' ? null : GMETA[gameKey]
  const title = meta ? `${meta.i} ${meta.l} — info` : 'Standings — info'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, letterSpacing: 1, color: COLORS.muted,
      padding: '4px 10px',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 999,
      marginBottom: 8,
    }}>
      <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>About this page</span>
      <InfoPopup title={title}>{SCORING[gameKey]}</InfoPopup>
    </div>
  )
}
