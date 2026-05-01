#!/usr/bin/env node
/**
 * Draft Room: legacy → multi-user migration.
 *
 * Reads the existing single-row `draft_room` JSONB blob, splits Scott + Ty's
 * picks into per-user `UserAppData`, creates auth users for both with magic
 * link claim emails, creates show-host player rows (no auth user attached),
 * and writes everything into the new `players` + `player_picks` tables.
 *
 * Idempotent: safe to re-run. Existing rows are upserted, not duplicated.
 *
 * Required env:
 *   SUPABASE_URL                  Project URL
 *   SUPABASE_SERVICE_ROLE_KEY     Service role key (admin)
 *   SCOTT_EMAIL                   Email for Scott's auth account
 *   TY_EMAIL                      Email for Ty's auth account
 *
 * Usage:
 *   node scripts/migrate-to-multiuser.mjs
 *   node scripts/migrate-to-multiuser.mjs --dry-run    # print, don't write
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

const DRY = process.argv.includes('--dry-run')

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const scottEmail = process.env.SCOTT_EMAIL
const tyEmail = process.env.TY_EMAIL

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!scottEmail || !tyEmail) {
  console.error('Missing SCOTT_EMAIL and/or TY_EMAIL')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

// --- Show host roster (matches handles given by user) ---
const SHOW_HOSTS = [
  { display_name: "Talkin' Baseball", handle: 'talkinbaseball_', is_show_account: true, is_public: true, bio: 'Official show account' },
  { display_name: 'Jimmy O’Brien',  handle: 'jomboy_',         is_show_account: true, is_public: true, bio: 'Jomboy — Jomboy Media' },
  { display_name: 'Jake Storiale',      handle: 'jolly_olive',     is_show_account: true, is_public: true, bio: 'Jolly — Talkin’ Baseball' },
  { display_name: 'Chris Rose',         handle: 'chrisrosesports', is_show_account: true, is_public: true, bio: 'Chris Rose Sports' },
  { display_name: 'Trevor Plouffe',     handle: 'trevorplouffe',   is_show_account: true, is_public: true, bio: 'Trevor Plouffe — Talkin’ Baseball' },
  { display_name: 'Jomboy Media',       handle: 'jomboymedia',     is_show_account: true, is_public: true, bio: 'Network account' },
  { display_name: 'Eno Sarris',         handle: 'enosarris',       is_show_account: true, is_public: true, bio: 'Rates and Barrels — The Athletic' },
]

// --- Helpers ---

/**
 * Split legacy AppData into a single user's UserAppData by their owner name.
 * @param {object} legacy
 * @param {'Scott'|'Ty'} who
 */
function splitForOwner(legacy, who) {
  const fa = (legacy.fa ?? [])
    .filter(p => p.owner === who)
    .map(({ owner, ...rest }) => rest)
  const td = (legacy.td ?? [])
    .filter(p => p.owner === who)
    .map(({ owner, ...rest }) => rest)
  return {
    fa,
    cy: legacy.cy?.[who] ?? [],
    pu: legacy.pu?.[who] ?? [],
    hr: legacy.hr?.[who] ?? {},
    td,
    aw: legacy.aw?.[who] ?? {
      alMVP: '', nlMVP: '', alROY: '', nlROY: '',
      alCY: '', nlCY: '', alMGR: '', nlMGR: '',
      alMVPR: 'none', nlMVPR: 'none',
      alROYR: 'none', nlROYR: 'none',
      alCYR: 'none', nlCYR: 'none',
      alMGRR: 'none', nlMGRR: 'none',
    },
    ou: legacy.ou?.[who] ?? {},
  }
}

async function findUserByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (error) throw error
  return data.users.find(u => (u.email ?? '').toLowerCase() === email.toLowerCase()) ?? null
}

async function ensureAuthUser(email, displayName) {
  let user = await findUserByEmail(email)
  if (user) {
    console.log(`  ✓ auth user exists for ${email} (${user.id})`)
    return user
  }
  if (DRY) {
    console.log(`  [dry] would create auth user for ${email}`)
    return { id: '<dry-run>', email }
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: false, // they'll confirm via magic link
    user_metadata: { display_name: displayName },
  })
  if (error) throw error
  console.log(`  + created auth user for ${email} (${data.user.id})`)
  return data.user
}

async function ensurePlayer({ user_id, display_name, handle, is_show_account, is_public, bio }) {
  // For show accounts, look up by handle. For users, look up by user_id.
  let existing = null
  if (user_id) {
    const { data } = await supabase.from('players').select('*').eq('user_id', user_id).maybeSingle()
    existing = data
  } else if (handle) {
    const { data } = await supabase.from('players').select('*').eq('handle', handle).maybeSingle()
    existing = data
  }
  if (existing) {
    console.log(`  ✓ player exists: ${display_name} (${existing.id})`)
    return existing
  }
  if (DRY) {
    console.log(`  [dry] would insert player: ${display_name}`)
    return { id: '<dry>', display_name, user_id, handle, is_show_account, is_public }
  }
  const { data, error } = await supabase
    .from('players')
    .insert({ user_id: user_id ?? null, display_name, handle: handle ?? null, is_show_account: !!is_show_account, is_public: is_public ?? true, bio: bio ?? null })
    .select('*')
    .single()
  if (error) throw error
  console.log(`  + created player: ${display_name} (${data.id})`)
  return data
}

async function upsertPicks(playerId, picks) {
  if (DRY) {
    console.log(`  [dry] would upsert picks for player ${playerId}: fa=${picks.fa.length} cy=${picks.cy.length} pu=${picks.pu.length} td=${picks.td.length}`)
    return
  }
  const { error } = await supabase
    .from('player_picks')
    .upsert({ player_id: playerId, data: picks, updated_at: new Date().toISOString() }, { onConflict: 'player_id' })
  if (error) throw error
  console.log(`  + saved picks for player ${playerId}`)
}

async function sendClaimLink(email) {
  if (DRY) { console.log(`  [dry] would send magic link to ${email}`); return }
  const { error } = await supabase.auth.admin.generateLink({ type: 'magiclink', email })
  if (error) {
    console.warn(`  ! could not send magic link to ${email}: ${error.message}`)
    return
  }
  console.log(`  + magic link issued for ${email}`)
}

// --- Main ---

async function main() {
  console.log(`Draft Room migration ${DRY ? '(DRY RUN)' : ''}`)
  console.log('-----------------------------------------')

  // 1. Pull the legacy JSONB row
  console.log('Loading legacy draft_room row...')
  const { data: row, error: rowErr } = await supabase
    .from('draft_room')
    .select('data')
    .eq('id', 1)
    .single()
  if (rowErr) throw rowErr
  const legacy = row.data
  if (!legacy?.fa) {
    console.error('  ! legacy row has no .fa array — refusing to migrate empty data')
    process.exit(1)
  }
  console.log(`  loaded legacy data: fa=${legacy.fa.length} td=${(legacy.td ?? []).length}`)

  // Optional: dump a backup of the legacy row to disk
  const backupPath = `./supabase/legacy-backup-${Date.now()}.json`
  if (!DRY) {
    const fs = await import('node:fs/promises')
    await fs.writeFile(backupPath, JSON.stringify(legacy, null, 2))
    console.log(`  backup written: ${backupPath}`)
  }

  // 2. Provision Scott + Ty
  console.log('\nProvisioning Scott...')
  const scottUser = await ensureAuthUser(scottEmail, 'Scott')
  const scottPlayer = await ensurePlayer({ user_id: scottUser.id, display_name: 'Scott', is_public: true })
  await upsertPicks(scottPlayer.id, splitForOwner(legacy, 'Scott'))

  console.log('\nProvisioning Ty...')
  const tyUser = await ensureAuthUser(tyEmail, 'Ty')
  const tyPlayer = await ensurePlayer({ user_id: tyUser.id, display_name: 'Ty', is_public: true })
  await upsertPicks(tyPlayer.id, splitForOwner(legacy, 'Ty'))

  // 3. Provision show host rows (no auth users)
  console.log('\nProvisioning show host accounts...')
  for (const host of SHOW_HOSTS) {
    const player = await ensurePlayer(host)
    // Initialize empty picks blob if missing.
    if (player.id !== '<dry>') {
      const { data: existing } = await supabase.from('player_picks').select('player_id').eq('player_id', player.id).maybeSingle()
      if (!existing) {
        await upsertPicks(player.id, { fa: [], cy: [], pu: [], hr: {}, td: [], aw: {
          alMVP: '', nlMVP: '', alROY: '', nlROY: '',
          alCY: '', nlCY: '', alMGR: '', nlMGR: '',
          alMVPR: 'none', nlMVPR: 'none',
          alROYR: 'none', nlROYR: 'none',
          alCYR: 'none', nlCYR: 'none',
          alMGRR: 'none', nlMGRR: 'none',
        }, ou: {} })
      }
    }
  }

  // 4. Send claim links
  console.log('\nIssuing claim magic links...')
  await sendClaimLink(scottEmail)
  await sendClaimLink(tyEmail)

  console.log('\nMigration complete.')
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
