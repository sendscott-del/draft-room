/**
 * Master list of 2026 free agent actual signings.
 *
 * Format: player name → "{years}yr {team}" string, matching how the
 * legacy data was stored (and how `parseActual` in lib/scoring.ts reads
 * it). When a host picks one of these players, the actuals lookup falls
 * through to this map so they score regardless of whether anyone else
 * also picked that player.
 *
 * Add a new entry here when a free agent signs.
 */
export const FA_ACTUALS_2026: Record<string, string> = {
  'Kyle Tucker':         '4yr LAD',
  'Kyle Schwarber':      '5yr PHI',
  'Cody Bellinger':      '5yr NYY',
  'Pete Alonso':         '5yr BAL',
  'Alex Bregman':        '5yr CHC',
  'Dylan Cease':         '7yr TOR',
  'Edwin Diaz':          '3yr LAD',
  'Framber Valdez':      '3yr DET',
  'Justin Verlander':    '1yr DET',
  'Zac Gallen':          '1yr ARZ',
  "Ryan O'Hearn":        '2yr PIT',
  'Devin Williams':      '3yr NYM',
  'Robert Suarez':       '3yr ATL',
  'Bo Bichette':         '3yr NYM',
  'Munetaka Murakami':   '2yr CWS',
  'Ranger Suarez':       '5yr BOS',
  'Eugenio Suarez':      '1yr CIN',
  'JT Realmuto':         '3yr PHI',
  'Chris Bassitt':       '1yr BAL',
  'Tatsuya Imai':        '3yr HOU',
  'Merrill Kelly':       '2yr ARZ',
  'Jorge Polanco':       '2yr NYM',
  'Harrison Bader':      '2yr SFG',
  'Michael Soroka':      '1yr ARZ',
  'Emilio Pagan':        '2yr CIN',
  'Luis Arraez':         '1yr SFG',
  'Ha-Seong Kim':        '1yr ATL',
  'Marcell Ozuna':       '1yr PIT',
  'Tyler Rogers':        '3yr TOR',
  // Players some hosts picked that we still need real-world signing data for:
  // 'Trent Grisham':    '',
  // 'Michael King':     '',
  // 'Paul Goldschmidt': '',
  // 'Gleyber Torres':   '',
  // 'Starling Marte':   '',
  // 'Max Scherzer':     '',
  // 'Miguel Rojas':     '',
}
