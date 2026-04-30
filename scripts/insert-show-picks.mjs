#!/usr/bin/env node
/**
 * Insert show-host picks into the `player_picks` table.
 *
 * Usage:
 *   node scripts/insert-show-picks.mjs path/to/picks.json
 *
 * Required env:
 *   SUPABASE_URL                  Project URL
 *   SUPABASE_SERVICE_ROLE_KEY     Service role key (admin)
 *
 * picks.json shape:
 *   {
 *     "talkin_jake": {                       // host handle (matches players.handle)
 *       "cy": [{ round, pitcher, lg, odds?, rookie? }, ...],
 *       "fa": [{ round, player, team, years, newTeam, award, asg, actual? }, ...],
 *       "pu": [...], "hr": {...}, "td": [...], "aw": {...}, "ou": {...}
 *     },
 *     "trevorplouffe": { ... }
 *   }
 *
 * Picks are MERGED into existing data — only the games you provide are
 * overwritten. Empty arrays/objects mean "this host did not play this game."
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const file = process.argv[2]
const dry = process.argv.includes('--dry-run')

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!file) {
  console.error('Usage: node scripts/insert-show-picks.mjs <picks.json> [--dry-run]')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })
const picksByHandle = JSON.parse(readFileSync(file, 'utf8'))

async function main() {
  for (const [handle, gameData] of Object.entries(picksByHandle)) {
    if (handle.startsWith('_')) continue // allow comment keys
    console.log(`\n→ ${handle}`)
    const { data: player, error: pErr } = await supabase
      .from('players')
      .select('id, display_name, is_show_account')
      .eq('handle', handle)
      .maybeSingle()
    if (pErr || !player) {
      console.error(`  ✗ player with handle "${handle}" not found — skipping`)
      continue
    }

    // Load existing picks, merge in new game data, save back.
    const { data: existing, error: rErr } = await supabase
      .from('player_picks')
      .select('data')
      .eq('player_id', player.id)
      .maybeSingle()
    if (rErr) throw rErr

    const merged = { ...(existing?.data ?? {}), ...gameData }
    console.log(`  merging games:`, Object.keys(gameData).join(', '))

    if (dry) {
      console.log(`  [dry] would upsert player_picks for ${player.display_name}`)
      continue
    }

    const { error: uErr } = await supabase
      .from('player_picks')
      .upsert({ player_id: player.id, data: merged, updated_at: new Date().toISOString() }, { onConflict: 'player_id' })
    if (uErr) throw uErr
    console.log(`  ✓ saved`)
  }
  console.log('\nDone.')
}

main().catch(err => {
  console.error('Insert failed:', err)
  process.exit(1)
})
