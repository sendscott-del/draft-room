/**
 * CY Young Vote Projection Algorithm
 *
 * Projects end-of-season CY Young votes based on current stats and betting odds.
 *
 * BBWAA CY Young voting:
 * - 30 voters (2 per MLB city, 15 cities per league)
 * - Each voter ranks 5 pitchers: 1st = 7pts, 2nd = 4pts, 3rd = 3pts, 4th = 2pts, 5th = 1pt
 * - Max possible per pitcher: 210 (unanimous 1st = 30 × 7)
 * - Total points cast per league: 510 (30 voters × 17 pts each)
 *
 * 2025 actual results (calibration data):
 * AL: Skubal 198, Crochet 132, Brown 80, Fried 61, Woo 26, Rodón 5, Chapman 4, deGrom 2, Rogers 1, Rasmussen 1
 * NL: Skenes 210 (unanimous), Sánchez 120, Yamamoto 72, Webb 47, Peralta 44, Pivetta 7, Luzardo 5, Abbott 4, Wheeler 1
 *
 * Typical distribution pattern (from 2025 data):
 * - Winner:  ~195-210 (39-41% of pool)
 * - 2nd:     ~120-132 (24-26%)
 * - 3rd:      ~72-80  (14-16%)
 * - 4th:      ~47-61  (9-12%)
 * - 5th:      ~26-44  (5-9%)
 * - 6th+:      ~1-7   (< 1.5%)
 */

import type { CYPick } from '../types'

// Total points per league: 30 voters × (7+4+3+2+1) = 30 × 17 = 510
const VOTE_POOL_PER_LEAGUE = 510

// Convert American odds to implied probability
function oddsToProb(odds: string): number {
  if (!odds) return 0
  const n = parseInt(odds.replace('+', ''))
  if (isNaN(n)) return 0
  if (n > 0) return 100 / (n + 100)
  return Math.abs(n) / (Math.abs(n) + 100)
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

  const eraScore = Math.max(0, Math.min(100, 100 - (era - 1.5) * (100 / 4.5)))
  const kPer9 = (k / ip) * 9
  const kScore = Math.max(0, Math.min(100, (kPer9 - 4) * (100 / 10)))
  const winPct = w / Math.max(w + l, 1)
  const winScore = winPct * 80 + Math.min(w, 20) * 1
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
 *
 * Inputs may contain the same pitcher more than once (each entry is one
 * player's pick). We dedupe by pitcher first — taking the best available
 * odds + stats — so the rank curve isn't distorted by N copies of Skubal
 * crowding the top slots.
 */
export function projectCYVotes(
  allPicks: CYPick[],
): Map<string, ProjectionResult> {
  const results = new Map<string, ProjectionResult>()
  if (allPicks.length === 0) return results

  // Dedupe: one entry per pitcher, taking the strongest odds and the most
  // informative stats line we've seen across all players who picked them.
  const dedup = new Map<string, CYPick>()
  for (const pick of allPicks) {
    const cur = dedup.get(pick.pitcher)
    if (!cur) { dedup.set(pick.pitcher, pick); continue }
    const merged: CYPick = { ...cur }
    const curOdds = oddsToProb(cur.liveOdds || cur.odds || '')
    const newOdds = oddsToProb(pick.liveOdds || pick.odds || '')
    if (!cur.odds && pick.odds) merged.odds = pick.odds
    if (newOdds > curOdds) {
      merged.odds = pick.odds || merged.odds
      merged.liveOdds = pick.liveOdds || merged.liveOdds
    }
    const curIp = cur.stats ? parseFloat(cur.stats.ip) || 0 : 0
    const newIp = pick.stats ? parseFloat(pick.stats.ip) || 0 : 0
    if (newIp > curIp) merged.stats = pick.stats
    dedup.set(pick.pitcher, merged)
  }

  const scores: { pitcher: string; oddsScore: number; statsScore: number | null; ip: number }[] = []

  for (const pick of dedup.values()) {
    const oddsStr = pick.liveOdds || pick.odds
    const oddsProb = oddsToProb(oddsStr || '')
    const stats = perfScore(pick.stats)
    const ip = pick.stats ? parseFloat(pick.stats.ip) || 0 : 0

    scores.push({
      pitcher: pick.pitcher,
      oddsScore: oddsProb * 100,
      statsScore: stats,
      ip,
    })
  }

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

  blended.sort((a, b) => b.score - a.score)

  const totalScore = blended.reduce((s, x) => s + x.score, 0)
  if (totalScore === 0) {
    blended.forEach(b => {
      results.set(b.pitcher, { projectedVotes: 0, confidence: 'low', method: b.method })
    })
    return results
  }

  // Vote distribution curve calibrated from 2025 actual results
  // AL: 198/510=.388, 132/510=.259, 80/510=.157, 61/510=.120, 26/510=.051
  // NL: 210/510=.412, 120/510=.235, 72/510=.141, 47/510=.092, 44/510=.086
  // Average: .400, .247, .149, .106, .068, .013, .009, .005, .002, .001
  const curveWeights = [0.400, 0.247, 0.149, 0.106, 0.068,
    0.013, 0.009, 0.005, 0.002, 0.001]

  blended.forEach((b, rank) => {
    const curveShare = rank < curveWeights.length ? curveWeights[rank] : 0
    const topScore = blended[0]?.score || 1
    const relStrength = b.score / topScore

    // Scale curve share by relative strength to the favorite
    const finalShare = curveShare * (0.3 + 0.7 * relStrength)
    const projVotes = Math.round(VOTE_POOL_PER_LEAGUE * finalShare)

    const confidence: 'low' | 'medium' | 'high' =
      avgIP < 15 ? 'low' :
        avgIP < 80 ? 'medium' : 'high'

    results.set(b.pitcher, {
      projectedVotes: Math.min(210, Math.max(0, projVotes)),
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
