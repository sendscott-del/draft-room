#!/usr/bin/env node
/**
 * Parse a Talkin' Baseball draft episode transcript into structured picks JSON.
 *
 * Uses the Claude Code CLI (`claude -p`) so it works with your existing auth —
 * no separate ANTHROPIC_API_KEY needed.
 *
 * Usage:
 *   node scripts/parse-transcript.mjs <transcript.txt> <game-key> <output.json>
 *
 *   game-key is one of: cy fa pu hr td aw ou
 *
 * Example:
 *   node scripts/parse-transcript.mjs \
 *     transcripts/cy-young-2026.txt cy \
 *     transcripts/cy-young-2026-picks.json
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const [transcriptPath, gameKey, outPath] = process.argv.slice(2)
if (!transcriptPath || !gameKey || !outPath) {
  console.error('usage: parse-transcript.mjs <transcript.txt> <game-key> <output.json>')
  process.exit(1)
}

const transcript = readFileSync(transcriptPath, 'utf8')

// Per-game schemas / instructions.
const GAME_PROMPTS = {
  cy: `Cy Young Award draft. Each host picks 10 pitchers across the AL and NL who they think will receive Cy Young votes. They snake-draft in rounds — Round 1 typically reverse order from the previous season's standings.

Output JSON shape per host:
[
  { "round": <global pick number, 1-based, in actual draft order>,
    "pitcher": "<full pitcher name>",
    "lg": "AL" | "NL",
    "rookie": <true if "never received a Cy Young vote" / "never voted" — they get a bonus rule for one rookie pick>,
    "votes": 0
  },
  ...
]`,
  fa: `Free Agent draft. Each host predicts where free agents will sign, contract length, etc.
Output per host: [{ round, player, team (3-letter), years (string), newTeam (bool), award (bool, prior CY/MVP/RoY winner), asg (bool, prior All-Star), actual: "" }]`,
  pu: `Position Unit draft. Each host picks 12 team-position units (INF+C, OF, SP, RP) by WAR.
Output per host: [{ r: round, team: "<team name>", unit: "INF+C"|"OF"|"SP"|"RP", war: 0 }]`,
  hr: `HR Team draft. Each host picks one player per defensive position (C, 1B, 2B, 3B, SS, RF, CF, LF, DH).
Output per host: { "C": {p, t (3-letter team), hr: 0}, "1B": {...}, ... }`,
  td: `Trade Deadline draft. Each host picks 32 players who will be traded by the deadline.
Output per host: [{ round, player, team: "" (until traded), traded: false, asg: false, award: false }]`,
  aw: `Awards picks (MVP, ROY, Cy Young, Manager of Year for AL+NL).
Output per host: { alMVP, nlMVP, alROY, nlROY, alCY, nlCY, alMGR, nlMGR, alMVPR: "none", ...all R fields "none" }`,
  ou: `Win Over/Under picks. The show splits the 30 teams across MULTIPLE episodes, so this transcript probably only covers a subset of teams (typically 6-10 per episode). Only output picks for the teams actually discussed in this transcript — do not invent picks for teams not mentioned.

Use 3-letter team abbreviations: ARI, ATL, BAL, BOS, CHC, CWS, CIN, CLE, COL, DET, HOU, KCR, LAA, LAD, MIA, MIL, MIN, NYM, NYY, OAK, PHI, PIT, SDP, SEA, SFG, STL, TBR, TEX, TOR, WSN.

Output per host: { "<3-letter team abbr>": {pick: "over"|"under", actual: ""}, ... }`,

  ps: `Postseason / Playoffs picks. Each host predicts division winners, wild card teams, pennant (CS) winners, and the World Series winner.

Use 3-letter team abbreviations: ARI, ATL, BAL, BOS, CHC, CWS, CIN, CLE, COL, DET, HOU, KCR, LAA, LAD, MIA, MIL, MIN, NYM, NYY, OAK, PHI, PIT, SDP, SEA, SFG, STL, TBR, TEX, TOR, WSN.

Output per host (omit any sub-fields the host didn't pick):
{
  "divisions": {
    "alEast":    "<team abbr>",
    "alCentral": "<team abbr>",
    "alWest":    "<team abbr>",
    "nlEast":    "<team abbr>",
    "nlCentral": "<team abbr>",
    "nlWest":    "<team abbr>"
  },
  "wildCards": { "al": ["<abbr>","<abbr>","<abbr>"], "nl": ["<abbr>","<abbr>","<abbr>"] },
  "pennants":  { "al": "<team abbr>", "nl": "<team abbr>" },
  "ws":        "<team abbr>"
}`,
}

const gamePrompt = GAME_PROMPTS[gameKey]
if (!gamePrompt) {
  console.error(`Unknown game key: ${gameKey}. Use one of: ${Object.keys(GAME_PROMPTS).join(', ')}`)
  process.exit(1)
}

const fullPrompt = `You are parsing a Talkin' Baseball podcast transcript to extract structured draft picks.

The transcript is from auto-generated YouTube captions. There are predictable transcription errors:
  "Sai Young" → "Cy Young"
  "Skins"     → "Skenes"   (Paul Skenes)
  "Plof"      → "Plouffe"  (Trevor Plouffe)
  "Saras"     → "Sarris"   (Eno Sarris)
  "Scooble" / "Skoo" / "Teroo" → "Skubal"  (Tarik Skubal)
  "Sai 11"/"SI 6"/etc → "sub-2.00 ERA" type ERA references, ignore
  "Storyelli" → "Storiale" (Jake Storiale)
  "John Boy" / "Jomboy" → Jimmy O'Brien
  "n Mlan" / "no Mlan" / "Nolan" → "Nolan McLean"
Correct these and any obvious mishearings of player or team names when extracting picks.

The hosts whose picks we want, by handle:
  trevorplouffe   = Trevor Plouffe
  jolly_olive     = Jake Storiale (Jolly Olive)
  jomboy_         = Jimmy O'Brien
  chrisrosesports = Chris Rose
Note: skip guests (Eno Sarris, etc.) — only output picks for the listed hosts that actually appear in this episode.

Game type: ${gameKey.toUpperCase()}

${gamePrompt}

Output a single JSON object keyed by host handle, with each host's picks in the format above. Only include hosts that participated in this episode. Do not include any preamble, code fences, or commentary — output JSON only, parseable directly.

Example structure:
{
  "trevorplouffe": [...picks in pick order...],
  "jolly_olive":   [...picks in pick order...]
}

Transcript follows:
======== TRANSCRIPT ========
${transcript}
======== END TRANSCRIPT ========

Output JSON only:`

console.log(`Sending ${transcript.length.toLocaleString()} chars of transcript to Claude…`)

// Send via stdin to claude -p. Use --output-format text (default) and we'll
// extract the JSON ourselves.
const proc = spawnSync('claude', ['-p', fullPrompt], {
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
})

if (proc.error) {
  console.error('failed to invoke claude CLI:', proc.error.message)
  process.exit(1)
}
if (proc.status !== 0) {
  console.error(`claude exited with code ${proc.status}`)
  console.error(proc.stderr)
  process.exit(1)
}

const out = proc.stdout.trim()

// Extract first {...} balanced JSON block from output.
const start = out.indexOf('{')
if (start === -1) {
  console.error('no JSON object found in claude output:')
  console.error(out)
  process.exit(1)
}
let depth = 0
let inString = false
let escape = false
let end = -1
for (let i = start; i < out.length; i++) {
  const c = out[i]
  if (escape) { escape = false; continue }
  if (c === '\\' && inString) { escape = true; continue }
  if (c === '"') { inString = !inString; continue }
  if (inString) continue
  if (c === '{') depth++
  else if (c === '}') {
    depth--
    if (depth === 0) { end = i; break }
  }
}
if (end === -1) {
  console.error('unbalanced JSON in claude output')
  process.exit(1)
}

const jsonText = out.slice(start, end + 1)
let parsed
try {
  parsed = JSON.parse(jsonText)
} catch (e) {
  console.error('failed to parse JSON:', e.message)
  console.error('--- raw json text ---')
  console.error(jsonText)
  process.exit(1)
}

writeFileSync(outPath, JSON.stringify(parsed, null, 2) + '\n')
console.log(`wrote ${outPath}`)
console.log(`hosts found: ${Object.keys(parsed).join(', ')}`)
for (const [h, picks] of Object.entries(parsed)) {
  const n = Array.isArray(picks) ? picks.length : Object.keys(picks).length
  console.log(`  ${h}: ${n} ${gameKey} entries`)
}
