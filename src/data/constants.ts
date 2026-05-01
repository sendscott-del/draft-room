export const TEAMS = ["ARI","ATL","BAL","BOS","CHC","CWS","CIN","CLE","COL","DET","HOU","KCR","LAA","LAD","MIA","MIL","MIN","NYM","NYY","OAK","PHI","PIT","SDP","SEA","SFG","STL","TBR","TEX","TOR","WSN"]

export const POS = ["C","1B","2B","3B","SS","LF","CF","RF","DH"]

export const PLAYERS = ["Scott","Ty"] as const

export const GMETA: Record<string, { l: string; i: string; c: string; status: 'final' | 'interim' }> = {
  fa: { l: "Free Agent",     i: "\u{1F4B0}", c: "#5eb774", status: "final" },
  cy: { l: "Cy Young",       i: "\u26BE",    c: "#5b8cc7", status: "interim" },
  // Position Unit: jersey emoji reads better as "team unit" than the
  // stadium icon it replaced, which lots of testers read as "stats."
  pu: { l: "Position Unit",  i: "\u{1F3BD}", c: "#a37ed1", status: "interim" },
  hr: { l: "HR Team",        i: "\u{1F4A5}", c: "#e45b5b", status: "interim" },
  aw: { l: "MVP & RoY",      i: "\u{1F3C6}", c: "#39a9bd", status: "interim" },
  // Win O/U: balance scale is a clearer "over vs under" symbol than the
  // bar-chart icon it replaced.
  ou: { l: "Win O/U",        i: "\u2696\uFE0F", c: "#d4669d", status: "interim" },
  td: { l: "Trade Deadline", i: "\u{1F504}", c: "#f0a531", status: "interim" },
  ps: { l: "Postseason",     i: "\u{2B50}",  c: "#e8b54a", status: "interim" },
}

export const NAV = [
  { id: "lb", l: "\u{1F3C6} Standings" },
  { id: "fa", l: "\u{1F4B0} Free Agent" },
  { id: "cy", l: "\u26BE Cy Young" },
  { id: "pu", l: "\u{1F3BD} Position Unit" },
  { id: "hr", l: "\u{1F4A5} HR Team" },
  { id: "td", l: "\u{1F504} Trade Deadline" },
  { id: "ou", l: "\u2696\uFE0F O/U" },
  { id: "ps", l: "\u2B50 Postseason" },
  { id: "aw", l: "\u{1F3C6} Awards" },
  { id: "ru", l: "\u{1F4D6} Rules" },
]

// Win totals locked from the Talkin' Baseball TPP episodes (DraftKings line
// each team called against). These supersede the older preseason values
// and are the canonical lines used for scoring.
export const OUL = [
  { a: "ARI", n: "Diamondbacks", l: 79.5  },
  { a: "ATL", n: "Braves",       l: 88.5  },
  { a: "BAL", n: "Orioles",      l: 85.5  },
  { a: "BOS", n: "Red Sox",      l: 87.5  },
  { a: "CHC", n: "Cubs",         l: 88.5  },
  { a: "CWS", n: "White Sox",    l: 66.5  },
  { a: "CIN", n: "Reds",         l: 81.5  },
  { a: "CLE", n: "Guardians",    l: 79.5  },
  { a: "COL", n: "Rockies",      l: 53.5  },
  { a: "DET", n: "Tigers",       l: 85.5  },
  { a: "HOU", n: "Astros",       l: 86.5  },
  { a: "KCR", n: "Royals",       l: 81.5  },
  { a: "LAA", n: "Angels",       l: 70.5  },
  { a: "LAD", n: "Dodgers",      l: 102.5 },
  { a: "MIA", n: "Marlins",      l: 72.5  },
  { a: "MIL", n: "Brewers",      l: 84.5  },
  { a: "MIN", n: "Twins",        l: 73.5  },
  { a: "NYM", n: "Mets",         l: 90.5  },
  { a: "NYY", n: "Yankees",      l: 90.5  },
  { a: "OAK", n: "Athletics",    l: 75.5  },
  { a: "PHI", n: "Phillies",     l: 91.5  },
  { a: "PIT", n: "Pirates",      l: 78.5  },
  { a: "SDP", n: "Padres",       l: 83.5  },
  { a: "SEA", n: "Mariners",     l: 90.5  },
  { a: "SFG", n: "Giants",       l: 80.5  },
  { a: "STL", n: "Cardinals",    l: 69.5  },
  { a: "TBR", n: "Rays",         l: 77.5  },
  { a: "TEX", n: "Rangers",      l: 83.5  },
  { a: "TOR", n: "Blue Jays",    l: 92.5  },
  { a: "WSN", n: "Nationals",    l: 65.5  },
]

export const GAME_STATUS: Record<string, 'final' | 'interim'> = {
  fa: 'final',
  cy: 'interim',
  pu: 'interim',
  hr: 'interim',
  aw: 'interim',
  ou: 'interim',
  td: 'interim',
  ps: 'interim',
}

// Talkin' Baseball-inspired palette: deep navy field, cream highlights,
// warm vintage-baseball gold accent. The merch uses navy + cream + gold +
// crossed-bats motifs heavily, so the app borrows those.
export const COLORS = {
  bg:         '#0c1a2c', // deep TB navy
  bg2:        '#08121f', // even darker — for header / cards-on-cards
  cardBg:     'rgba(255,255,255,0.045)',
  border:     'rgba(245,233,200,0.12)', // border gets a subtle cream tint
  text:       '#f5ede0', // cream (vs cool white)
  textBright: '#ffffff',
  muted:      '#7a8aa0',
  muted2:     '#a4b2c6',
  // Game accent colors — kept recognizable but tonally adjusted toward warm
  green:  '#5eb774',
  blue:   '#5b8cc7',
  purple: '#a37ed1',
  red:    '#e45b5b',
  amber:  '#f0a531',
  cyan:   '#39a9bd',
  pink:   '#d4669d',
  gold:   '#e8b54a', // warm TB gold (vs old neon #fbbf24)
}

// Brand SVG: crossed bats — used in the header and sign-in screen.
export const CROSSED_BATS_SVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g stroke="currentColor" stroke-width="3.5" stroke-linecap="round">
    <path d="M10 54 L48 16" />
    <path d="M16 10 L54 48" />
  </g>
  <g fill="currentColor">
    <circle cx="48" cy="16" r="4.5" />
    <circle cx="54" cy="48" r="4.5" />
  </g>
</svg>`
