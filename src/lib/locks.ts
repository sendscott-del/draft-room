const LOCK_DATE = new Date('2026-03-27T00:05:00Z')     // Mar 26 7:05pm CT
const DEADLINE_DATE = new Date('2026-08-03T22:00:00Z') // Aug 3 6pm ET
const SEASON_END = new Date('2026-09-28T03:59:59Z')    // Sep 27 midnight ET

export function isLocked(game: string): boolean {
  const now = new Date()
  const seasonStarted = now >= LOCK_DATE
  if (['fa', 'cy', 'pu', 'hr'].includes(game)) return true
  if (game === 'td') return false
  if (['aw', 'ou'].includes(game)) return seasonStarted
  return false
}

function fmtDiff(diff: number): string {
  const days = Math.floor(diff / 86400000)
  const hrs = Math.floor((diff % 86400000) / 3600000)
  const mins = Math.floor((diff % 3600000) / 60000)
  const secs = Math.floor((diff % 60000) / 1000)
  const parts: string[] = []
  if (days > 0) parts.push(days + 'd')
  parts.push((hrs < 10 ? '0' : '') + hrs + 'h')
  parts.push((mins < 10 ? '0' : '') + mins + 'm')
  parts.push((secs < 10 ? '0' : '') + secs + 's')
  return parts.join(' ')
}

export interface CountdownState {
  label: string
  time: string
  phase: 'preseason' | 'season' | 'deadline' | 'done'
  isDone: boolean
}

export function getCountdownState(): CountdownState {
  const now = new Date()
  if (now < LOCK_DATE) return { label: 'Picks Lock In', time: fmtDiff(LOCK_DATE.getTime() - now.getTime()), phase: 'preseason', isDone: false }
  if (now < DEADLINE_DATE) return { label: 'Trade Deadline In', time: fmtDiff(DEADLINE_DATE.getTime() - now.getTime()), phase: 'season', isDone: false }
  if (now < SEASON_END) return { label: 'Season Ends In', time: fmtDiff(SEASON_END.getTime() - now.getTime()), phase: 'deadline', isDone: false }
  return { label: 'Season Complete', time: '\u{1F3C6} Final Standings', phase: 'done', isDone: true }
}
