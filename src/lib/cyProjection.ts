/**
 * CY Young Vote Projection Algorithm
 *
 * Projects end-of-season CY Young votes based on current stats and betting odds.
 *
 * BBWAA CY Young voting:
 * - 30 voters (one per market), each ranks 5 pitchers
 * - 1st place = 7 pts, 2nd = 4 pts, 3rd = 3 pts, 4th = 2 pts, 5th = 1 pt
 * - Max possible: 210 (unanimous 1st)
 *
 * Historical vote distributions (typical season, per league):
 * - Winner:  150–210 votes (avg ~180)
 * - 2nd:      60–130 votes (avg ~90)
 * - 3rd:      20–70 votes  (avg ~40)
 * - 4th:      10–40 votes  (avg ~20)
 * - 5th:       5–25 votes  (avg ~12)
 * - 6th-8th:   1–10 votes  (avg ~4)
 * - 9th-10th:  0–5 votes   (avg ~1)
 * - Others:    0
 *
 * The algorithm combines two signals:
 * 1. Betting odds (implied probability → expected vote share)
 * 2. Current pitching stats (ERA, W-L, K, IP → performance score)
 *
 * When both are available, we blend 60% odds + 40% stats.
 * Early season (< 30 IP), odds are weighted more heavily (80/20).
 * Late season (> 150 IP), stats are weighted more (40/60).
 */

import type { CYPick } from '../types'

// Historical vote distribution template per league
// These represent how ~750 total votes typically distribute
const VOTE_POOL_PER_LEAGUE = 750 // approx total votes cast per league (top ~15 pitchers)

// Convert American odds to implied probability
function oddsToProb(odds: string): number {
  if (!odds) return 0
  const n = parseInt(odds.replace('+', ''))
  if (isNaN(n)) return 0
  if (n > 0) return 100 / (n + 100) // positive odds: +400 → 20%
  return Math.abs(n) / (Math.abs(n) + 100) // negative odds: -150 → 60%
}

// Performance score based on pitching stats (0–100 scale)
function perfScore(stats?: CYPick['stats']): number | null {
  if (!stats) return null
  const era = parseFloat(stats.era)
  const ip = parseFloat(stats.ip)
  const k = stats.k
  const w = stats.w
  const l = stats.l

  if (isNaN(era) || isNaN(ip) || ip === 0) return null

  // ERA score: 1.50 = 100, 3.00 = 70, 4.50 = 30, 6.00 = 0
  const eraScore = Math.max(0, Math.min(100, 100 - (era - 1.5) * (100 / 4.5)))

  // K/9 score: normalize to ~100 scale (12 K/9 = 100, 6 K/9 = 30)
  const kPer9 = (k / ip) * 9
  const kScore = Math.max(0, Math.min(100, (kPer9 - 4) * (100 / 10)))

  // Win score: winning record matters
  const winPct = w / Math.max(w + l, 1)
  const winScore = winPct * 80 + Math.min(w, 20) * 1 // bonus for raw wins

  // IP score: more innings = more credibility (200 IP = max, pro-rated to current pace)
  const ipScore = Math.min(100, (ip / 30) * 25) // early season: 30 IP = 25 pts

  // Weighted combo
  return eraScore * 0.45 + kScore * 0.25 + winScore * 0.15 + ipScore * 0.15
}

interface ProjectionResult {
  projectedVotes: number
  confidence: 'low' | 'medium' | 'high'
  method: string // what data drove the projection
}

/**
 * Project CY Young votes for all pitchers in a league.
 * We project relative to other pitchers because votes are zero-sum.
 */
export function projectCYVotes(
  allPicks: CYPick[], // all pitchers from both players in one league
): Map<string, ProjectionResult> {
  const results = new Map<string, ProjectionResult>()
  if (allPicks.length === 0) return results

  // Step 1: Calculate raw scores for each pitcher
  const scores: { pitcher: string; oddsScore: number; statsScore: number | null; ip: number }[] = []

  for (const pick of allPicks) {
    // Use live odds if available, fall back to draft odds
    const oddsStr = pick.liveOdds || pick.odds
    const oddsProb = oddsToProb(oddsStr)
    const stats = perfScore(pick.stats)
    const ip = pick.stats ? parseFloat(pick.stats.ip) || 0 : 0

    scores.push({
      pitcher: pick.pitcher,
      oddsScore: oddsProb * 100, // scale to 0-100
      statsScore: stats,
      ip,
    })
  }

  // Step 2: Blend odds + stats based on season progress
  const avgIP = scores.reduce((s, x) => s + x.ip, 0) / Math.max(scores.length, 1)
  // Early season: lean on odds. Late season: lean on stats.
  const statsWeight = avgIP < 20 ? 0.15 : avgIP < 60 ? 0.35 : avgIP < 120 ? 0.50 : 0.60
  const oddsWeight = 1 - statsWeight

  const blended: { pitcher: string; score: number; method: string }[] = scores.map(s => {
    if (s.statsScore !== null && s.oddsScore > 0) {
      return {
        pitcher: s.pitcher,
        score: s.oddsScore * oddsWeight + s.statsScore * statsWeight,
        method: `${Math.round(oddsWeight * 100)}% odds + ${Math.round(statsWeight * 100)}% stats`,
      }
    } else if (s.oddsScore > 0) {
      return { pitcher: s.pitcher, score: s.oddsScore, method: 'odds only' }
    } else if (s.statsScore !== null) {
      return { pitcher: s.pitcher, score: s.statsScore, method: 'stats only' }
    }
    return { pitcher: s.pitcher, score: 0, method: 'no data' }
  })

  // Step 3: Distribute votes proportionally
  // Sort by score descending
  blended.sort((a, b) => b.score - a.score)

  const totalScore = blended.reduce((s, x) => s + x.score, 0)
  if (totalScore === 0) {
    blended.forEach(b => {
      results.set(b.pitcher, { projectedVotes: 0, confidence: 'low', method: b.method })
    })
    return results
  }

  // Use historical vote curve shape (top-heavy distribution)
  // The winner gets ~40% of pool, 2nd ~18%, 3rd ~10%, etc.
  const curveWeights = [0.38, 0.18, 0.10, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.015,
    0.01, 0.01, 0.005, 0.005, 0.005]

  // Blend proportional distribution with curve-based distribution
  blended.forEach((b, rank) => {
    // Curve share (if ranked)
    const curveShare = rank < curveWeights.length ? curveWeights[rank] : 0.002

    // Blend: use curve shape but scale by relative strength
    // If a pitcher has much higher odds, they get more curve weight
    const topScore = blended[0]?.score || 1
    const relStrength = b.score / topScore
    const finalShare = curveShare * (0.4 + 0.6 * relStrength)

    const projVotes = Math.round(VOTE_POOL_PER_LEAGUE * finalShare)

    const confidence: 'low' | 'medium' | 'high' =
      avgIP < 15 ? 'low' :
        avgIP < 80 ? 'medium' : 'high'

    results.set(b.pitcher, {
      projectedVotes: Math.max(0, projVotes),
      confidence,
      method: b.method,
    })
  })

  return results
}

/**
 * Get total projected votes for a player across both leagues.
 */
export function projectPlayerTotal(
  cyData: { Scott: CYPick[]; Ty: CYPick[] },
  player: 'Scott' | 'Ty'
): number {
  const picks = cyData[player]
  const alPicks = picks.filter(p => p.lg === 'AL')
  const nlPicks = picks.filter(p => p.lg === 'NL')

  // Get all pitchers in each league (from both players for relative ranking)
  const allAL = [...cyData.Scott.filter(p => p.lg === 'AL'), ...cyData.Ty.filter(p => p.lg === 'AL')]
  const allNL = [...cyData.Scott.filter(p => p.lg === 'NL'), ...cyData.Ty.filter(p => p.lg === 'NL')]

  const alProj = projectCYVotes(allAL)
  const nlProj = projectCYVotes(allNL)

  let total = 0
  for (const pick of alPicks) {
    total += alProj.get(pick.pitcher)?.projectedVotes ?? 0
  }
  for (const pick of nlPicks) {
    total += nlProj.get(pick.pitcher)?.projectedVotes ?? 0
  }
  return total
}
