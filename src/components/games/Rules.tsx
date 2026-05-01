import { GMETA } from '../../data/constants'
import Card from '../ui/Card'

const RULES: Record<string, string[]> = {
  fa: [
    '32-player snake draft, max 2 one-year deals',
    'New team signing: 10pts, Re-sign: 5pts',
    'Correct contract length: +5pts',
    'Prior CY/MVP/RoY or 2026 All-Star: +5pts',
    'After round 24: +5pts',
    'Unused team (no picks yet from that team): +5pts',
  ],
  cy: [
    '10 pitchers each',
    'Must include 1 pitcher with no prior CY votes',
    'Points = official Cy Young Award votes received',
  ],
  pu: [
    'Unit types: INF+C, OF, SP, RP',
    '12 teams each (24 total)',
    'Cannot draft 2 units from same team',
    'Points = total unit WAR',
  ],
  hr: [
    'One player per position: C, 1B, 2B, 3B, SS, LF, CF, RF, DH',
    'Team is eliminated once any player from it is drafted',
    'Points = total home runs hit by your lineup',
  ],
  td: [
    '32-player snake draft',
    'Correct new team: +10pts',
    'Player actually traded: +5pts',
    '2027 All-Star or prior CY/MVP/RoY: +5pts',
  ],
  aw: [
    'Pick AL MVP, NL MVP, AL RoY, NL RoY',
    'Winner: 25pts, Top 3 finalist: 10pts, Top 10: 5pts',
  ],
  ou: [
    'Over/under projected wins for all 30 teams',
    '3pts per correct pick, max 90pts',
  ],
  ps: [
    '6 division winners + 3 wild cards per league',
    'Pick the AL & NL pennant winners',
    'Pick the World Series champion',
    'Locked when the season starts',
  ],
}

export default function Rules() {
  return (
    <>
      {Object.keys(GMETA).map(k => {
        const m = GMETA[k]
        const rules = RULES[k] ?? []
        return (
          <Card key={k} style={{ borderLeft: `3px solid ${m.c}` }}>
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
              {m.i} {m.l}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, display: 'grid', gap: 4 }}>
              {rules.map((x, i) => (
                <li key={i} style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{x}</li>
              ))}
            </ul>
          </Card>
        )
      })}
    </>
  )
}
