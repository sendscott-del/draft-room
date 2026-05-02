export const TEAMS = ["ARI","ATL","BAL","BOS","CHC","CWS","CIN","CLE","COL","DET","HOU","KCR","LAA","LAD","MIA","MIL","MIN","NYM","NYY","OAK","PHI","PIT","SDP","SEA","SFG","STL","TBR","TEX","TOR","WSN"]

export const POS = ["C","1B","2B","3B","SS","LF","CF","RF","DH"]

export const PLAYERS = ["Scott","Ty"] as const

// Studio Talk palette: cream paper, navy ink, studio red, ballpark gold.
// Per-game accents are recolored to fit the new palette per PORT_NOTES.md.
export const GMETA: Record<string, { l: string; i: string; c: string; status: 'final' | 'interim' }> = {
  fa: { l: "Free Agent",     i: "\u{1F4B0}", c: "#0E1B2C", status: "final"   },
  cy: { l: "Cy Young",       i: "⚾",    c: "#1E4A6B", status: "interim" },
  pu: { l: "Position Unit",  i: "\u{1F3BD}", c: "#4F6B3F", status: "interim" },
  hr: { l: "HR Team",        i: "\u{1F4A5}", c: "#C8332C", status: "interim" },
  aw: { l: "MVP & RoY",      i: "\u{1F3C6}", c: "#7A3B68", status: "interim" },
  ou: { l: "Win O/U",        i: "⚖️", c: "#C8332C", status: "interim" },
  td: { l: "Trade Deadline", i: "\u{1F504}", c: "#D4A24C", status: "interim" },
  ps: { l: "Postseason",     i: "\u{2B50}",  c: "#D4A24C", status: "interim" },
}

export const NAV = [
  { id: "lb", l: "Standings"      },
  { id: "fa", l: "Free Agency"    },
  { id: "cy", l: "Cy Young"       },
  { id: "pu", l: "Position Unit"  },
  { id: "hr", l: "HR Team"        },
  { id: "td", l: "Trades"         },
  { id: "ou", l: "Win O/U"        },
  { id: "ps", l: "Postseason"     },
  { id: "aw", l: "Awards"         },
  { id: "ru", l: "Rules"          },
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

// Studio Talk palette — cream-field paper, navy ink, studio red, ballpark
// gold. Hard-edged, almanac-style. Field names preserved for back-compat
// with existing components; the game-accent fields (green, blue, etc.)
// have been re-mapped to fit the new palette so old call-sites still
// produce valid colors.
export const COLORS = {
  // Surfaces
  bg:         '#F2EAD3', // cream field
  bg2:        '#E9DFC2', // cream card field
  cardBg:     '#E9DFC2', // (alias for back-compat)
  cardBg2:    '#DCCFAA', // warm rule / shadow
  border:     '#0E1B2C', // navy ink — used as 1.5px hard border
  borderSoft: '#DCCFAA', // soft cream divider line
  // Ink (text)
  text:       '#0E1B2C',
  textBright: '#0E1B2C',
  cream:      '#F2EAD3',
  muted:      '#4A5466',
  muted2:     '#6B7385',
  // Accents
  red:        '#C8332C', // studio red
  redDeep:    '#9A2620',
  gold:       '#D4A24C', // ballpark gold
  goldDeep:   '#A77A2C',
  // Game accents (recolored for cream/navy palette)
  fa:         '#0E1B2C', // navy
  cy:         '#1E4A6B', // deep cyan-blue
  pu:         '#4F6B3F', // outfield green
  hr:         '#C8332C', // red
  td:         '#D4A24C', // gold
  aw:         '#7A3B68', // muted purple
  ou:         '#C8332C', // red
  ps:         '#D4A24C', // gold
  // Legacy field names — kept so older components don't break.
  // These now map onto the Studio Talk palette.
  green:      '#4F6B3F', // outfield grass
  blue:       '#1E4A6B', // deep cyan-blue
  purple:     '#7A3B68', // muted purple
  amber:      '#D4A24C', // ballpark gold
  cyan:       '#1E4A6B',
  pink:       '#C8332C',
}

// "DR" wordmark — replaces the old crossed-bats SVG. Rendered as a styled
// element rather than SVG so it can use Oswald + the gold drop-shadow trick
// from the Studio Talk mock. Components import this for the loading splash
// only; the Header has its own inline mark.
export const CROSSED_BATS_SVG = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="6" y="6" width="52" height="52" fill="#C8332C" stroke="#F2EAD3" stroke-width="3"/>
  <text x="32" y="42" text-anchor="middle" fill="#F2EAD3" font-family="Oswald, Impact, sans-serif" font-weight="700" font-size="28">DR</text>
</svg>`
