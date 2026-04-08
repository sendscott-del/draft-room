/**
 * CY Young Vote Projection Algorithm
 *
 * Projects end-of-season CY Young votes based on current stats and betting odds.
 *
 * BBWAA CY Young voting:
 * - 30 voters (2 per MLB city, 15 cities per league)
 * - Each voter ranks 5 pitchers: 1st = 5pts, 2nd = 4pts, 3rd = 3pts, 4th = 2pts, 5th = 1pt
 * - Max possible per pitcher: 150 (unanimous 1st = 30 × 5)
 * - Total points cast per league: 450 (30 voters × 15 pts each)
 *
 * Historical vote distributions (typical season, per league):
 * - Winner:  100–150 votes (avg ~130)
 * - 2nd:      50–100 votes (avg ~70)
 * - 3rd:      20–60 votes  (avg ~35)
 * - 4th:      10–35 votes  (avg ~20)
 * - 5th:       5–20 votes  (avg ~10)
 * - 6th-8th:   1–10 votes  (avg ~4)
 * - 9th-10th:  0–5 votes   (avg ~1)
 * - Others:    0
 *
 * Recent examples:
 * - 2025 NL: Paul Skenes 150 (unanimous), 2nd place ~65, 3rd ~40
 * - 2025 AL: Tarik Skubal ~140, 2nd ~55, 3rd ~30
 * - 2024 NL: Chris Sale 136, Skenes 78, Wheeler 39
 * - 2024 AL: Skubal 150 (unanimous), Clase 64, Crochet 42
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

// Total points cast per league: 30 voters × (5+4+3+2+1) = 30 × 15 = 450
const VOTE_POOL_PER_LEAGUE = 450

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
  const winScore = winPct * 80 + Math.min(w, 20) * 1

  // IP score: more innings = more credibility
  const ipScore = Math.min(100, (ip / 30) * 25)

  return eraScore * 0.45 + kScore * 0.25 + winScore * 0.15 + ipScore * 0.15
}

interface ProjectionResult {
  projectedVotes: number
  confidence: 'low' | 'medium' | 'high'
  method: string
}

/**
 * Project CY Young votes for all pitchers in a league.
 * Votes are distributed relative to the field since they're zero-sum.
 */
export function projectCYVotes(
  allPicks: CYPick[],
): Map<string, ProjectionResult> {
  const results = new Map<string, ProjectionResult>()
  if (allPicks.length === 0) return results

  // Step 1: Calculate raw scores for each pitcher
  const scores: { pitcher: string; oddsScore: number; statsScore: number | null; ip: number }[] = []

  for (const pick of allPicks) {
    const oddsStr = pick.liveOdds || pick.odds
    const oddsProb = oddsToProb(oddsStr)
    const stats = perfScore(pick.stats)
    const ip = pick.stats ? parseFloat(pick.stats.ip) || 0 : 0

    scores.push({
      pitcher: pick.pitcher,
      oddsScore: oddsProb * 100,
      statsScore: stats,
      ip,
    })
  }

  // Step 2: Blend odds + stats based on season progress
  const avgIP = scores.reduce((s, x) => s + x.ip, 0) / Math.max(scores.length, 1)
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

  // Step 3: Sort by score and distribute votes
  blended.sort((a, b) => b.score - a.score)

  const totalScore = blended.reduce((s, x) => s + x.score, 0)
  if (totalScore === 0) {
    blended.forEach(b => {
      results.set(b.pitcher, { projectedVotes: 0, confidence: 'low', method: b.method })
    })
    return results
  }

  // Historical vote curve — how votes typically distribute by rank
  // Based on real CY Young results: winner ~29%, 2nd ~16%, 3rd ~8%, etc.
  const curveWeights = [0.29, 0.16, 0.08, 0.05, 0.03, 0.02, 0.015, 0.01, 0.008, 0.005,
    0.004, 0.003, 0.002, 0.002, 0.001]

  blended.forEach((b, rank) => {
    const curveShare = rank < curveWeights.length ? curveWeights[rank] : 0.001
    const topScore = blended[0]?.score || 1
    const relStrength = b.score / topScore

    // Scale curve share by relative strength
    const finalShare = curveShare * (0.4 + 0.6 * relStrength)
    const projVotes = Math.round(VOTE_POOL_PER_LEAGUE * finalShare)

    const confidence: 'low' | 'medium' | 'high' =
      avgIP < 15 ? 'low' :
        avgIP < 80 ? 'medium' : 'high'

    results.set(b.pitcher, {
      projectedVotes: Math.min(150, Math.max(0, projVotes)), // cap at max possible (150)
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

  const allAL = [...cyData.Scott.filter(p => p.lg === 'AL'), ...cyData.Ty.filter(p => p.lg === 'AL')]
  const allNL = [...cyData.Scott.filter(p => p.lg === 'NL'), ...cyData.Ty.filter(p => p.lg === 'NL')]

  const alProj = projectCYVotes(allAL)
  const nlProj = projectCYVotes(allNL)

  let total = 0
  for (const pick of picks) {
    if (pick.lg === 'AL') total += alProj.get(pick.pitcher)?.projectedVotes ?? 0
    else total += nlProj.get(pick.pitcher)?.projectedVotes ?? 0
  }
  return total
}
