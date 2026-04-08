export const TEAMS = ["ARI","ATL","BAL","BOS","CHC","CWS","CIN","CLE","COL","DET","HOU","KCR","LAA","LAD","MIA","MIL","MIN","NYM","NYY","OAK","PHI","PIT","SDP","SEA","SFG","STL","TBR","TEX","TOR","WSN"]

export const POS = ["C","1B","2B","3B","SS","LF","CF","RF","DH"]

export const PLAYERS = ["Scott","Ty"] as const

export const GMETA: Record<string, { l: string; i: string; c: string; status: 'final' | 'interim' }> = {
  fa: { l: "Free Agent",     i: "\u{1F4B0}", c: "#22c55e", status: "final" },
  cy: { l: "Cy Young",       i: "\u26BE",    c: "#3b82f6", status: "interim" },
  pu: { l: "Position Unit",  i: "\u{1F3DF}", c: "#a855f7", status: "interim" },
  hr: { l: "HR Team",        i: "\u{1F4A5}", c: "#ef4444", status: "interim" },
  aw: { l: "MVP & RoY",      i: "\u{1F3C6}", c: "#06b6d4", status: "interim" },
  ou: { l: "Win O/U",        i: "\u{1F4CA}", c: "#ec4899", status: "interim" },
  td: { l: "Trade Deadline", i: "\u{1F504}", c: "#f59e0b", status: "interim" },
}

export const NAV = [
  { id: "lb", l: "\u{1F3C6} Standings" },
  { id: "fa", l: "\u{1F4B0} Free Agent" },
  { id: "cy", l: "\u26BE Cy Young" },
  { id: "pu", l: "\u{1F3DF} Position Unit" },
  { id: "hr", l: "\u{1F4A5} HR Team" },
  { id: "aw", l: "\u{1F3C6} Awards" },
  { id: "ou", l: "\u{1F4CA} O/U" },
  { id: "td", l: "\u{1F504} Trade Deadline" },
  { id: "ru", l: "\u{1F4D6} Rules" },
] // Order: FA, CY, PU, HR, AW, OU, TD

export const OUL = [
  { a: "ARI", n: "Diamondbacks", l: 79.5 },
  { a: "ATL", n: "Braves",       l: 87.5 },
  { a: "BAL", n: "Orioles",      l: 84.5 },
  { a: "BOS", n: "Red Sox",      l: 82.5 },
  { a: "CHC", n: "Cubs",         l: 81.5 },
  { a: "CWS", n: "White Sox",    l: 66.5 },
  { a: "CIN", n: "Reds",         l: 78.5 },
  { a: "CLE", n: "Guardians",    l: 78.5 },
  { a: "COL", n: "Rockies",      l: 52.5 },
  { a: "DET", n: "Tigers",       l: 81.5 },
  { a: "HOU", n: "Astros",       l: 85.5 },
  { a: "KCR", n: "Royals",       l: 80.5 },
  { a: "LAA", n: "Angels",       l: 70.5 },
  { a: "LAD", n: "Dodgers",      l: 102.5 },
  { a: "MIA", n: "Marlins",      l: 72.5 },
  { a: "MIL", n: "Brewers",      l: 84.5 },
  { a: "MIN", n: "Twins",        l: 73.5 },
  { a: "NYM", n: "Mets",         l: 88.5 },
  { a: "NYY", n: "Yankees",      l: 91.5 },
  { a: "OAK", n: "Athletics",    l: 75.5 },
  { a: "PHI", n: "Phillies",     l: 89.5 },
  { a: "PIT", n: "Pirates",      l: 74.5 },
  { a: "SDP", n: "Padres",       l: 83.5 },
  { a: "SEA", n: "Mariners",     l: 82.5 },
  { a: "SFG", n: "Giants",       l: 79.5 },
  { a: "STL", n: "Cardinals",    l: 78.5 },
  { a: "TBR", n: "Rays",         l: 76.5 },
  { a: "TEX", n: "Rangers",      l: 78.5 },
  { a: "TOR", n: "Blue Jays",    l: 91.5 },
  { a: "WSN", n: "Nationals",    l: 67.5 },
]

export const GAME_STATUS: Record<string, 'final' | 'interim'> = {
  fa: 'final',
  cy: 'interim',
  pu: 'interim',
  hr: 'interim',
  aw: 'interim',
  ou: 'interim',
  td: 'interim',
}

export const COLORS = {
  bg: '#0f172a',
  cardBg: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.09)',
  text: '#f1f5f9',
  muted: '#64748b',
  muted2: '#94a3b8',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  red: '#ef4444',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  pink: '#ec4899',
  gold: '#fbbf24',
}
