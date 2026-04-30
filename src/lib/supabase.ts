import { createClient, type Session, type User } from '@supabase/supabase-js'
import type { AppData, UserAppData, PlayerProfile } from '../types'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Namespace this app's session in localStorage so it doesn't collide
      // with other apps (magnify, sparkle pro, etc.) on the same Supabase
      // project. Without this they share `sb-{ref}-auth-token` and can
      // deadlock on each other's navigator-locks token-refresh lock.
      storageKey: 'draft-room-auth-token',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getCurrentUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export function onAuthChange(cb: (s: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session))
}

export async function signInWithMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpWithPassword(email: string, password: string, displayName: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw error
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  await supabase.auth.signOut()
}

// ---------------------------------------------------------------------------
// Players (profiles)
// ---------------------------------------------------------------------------

export async function getMyProfile(userId?: string): Promise<PlayerProfile | null> {
  let id = userId
  if (!id) {
    const { data: { session } } = await supabase.auth.getSession()
    id = session?.user?.id
  }
  if (!id) return null
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('user_id', id)
    .maybeSingle()
  if (error) throw error
  return data as PlayerProfile | null
}

export async function updateMyProfile(patch: Partial<Pick<PlayerProfile, 'display_name' | 'is_public' | 'avatar_url' | 'bio'>>) {
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) throw new Error('not authenticated')
  const { error } = await supabase
    .from('players')
    .update(patch)
    .eq('user_id', userId)
  if (error) throw error
}

export async function listVisiblePlayers(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('is_show_account', { ascending: false })
    .order('display_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as PlayerProfile[]
}

export async function listShowPlayers(): Promise<PlayerProfile[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_show_account', true)
    .order('display_name', { ascending: true })
  if (error) throw error
  return (data ?? []) as PlayerProfile[]
}

// ---------------------------------------------------------------------------
// Per-player picks (season-scoped)
// ---------------------------------------------------------------------------

let _currentSeasonCache: number | null = null

export async function getCurrentSeason(): Promise<number> {
  if (_currentSeasonCache != null) return _currentSeasonCache
  const { data, error } = await supabase
    .from('app_settings')
    .select('current_season')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw error
  _currentSeasonCache = (data?.current_season as number | undefined) ?? new Date().getFullYear()
  return _currentSeasonCache
}

export async function listSeasons(): Promise<number[]> {
  const { data, error } = await supabase
    .from('player_picks')
    .select('season')
  if (error) throw error
  const set = new Set<number>()
  for (const row of data ?? []) set.add((row as { season: number }).season)
  return Array.from(set).sort((a, b) => b - a)
}

export async function loadPicks(playerId: string, season: number): Promise<UserAppData | null> {
  const { data, error } = await supabase
    .from('player_picks')
    .select('data')
    .eq('player_id', playerId)
    .eq('season', season)
    .maybeSingle()
  if (error) throw error
  return (data?.data ?? null) as UserAppData | null
}

export async function loadMyPicks(season?: number): Promise<{ profile: PlayerProfile; picks: UserAppData | null } | null> {
  const profile = await getMyProfile()
  if (!profile) return null
  const s = season ?? await getCurrentSeason()
  const picks = await loadPicks(profile.id, s)
  return { profile, picks }
}

export async function saveMyPicks(picks: UserAppData, season?: number): Promise<void> {
  const profile = await getMyProfile()
  if (!profile) throw new Error('no player profile for current user')
  const s = season ?? await getCurrentSeason()
  const { error } = await supabase
    .from('player_picks')
    .upsert(
      { player_id: profile.id, season: s, data: picks, updated_at: new Date().toISOString() },
      { onConflict: 'player_id,season' }
    )
  if (error) throw error
}

// ---------------------------------------------------------------------------
// YouTube comments + game config
// ---------------------------------------------------------------------------

import type { GameConfig, YouTubeComment } from '../types'

export async function loadGameConfig(gameKey: GameConfig['game_key']): Promise<GameConfig | null> {
  const { data, error } = await supabase
    .from('games_config')
    .select('*')
    .eq('game_key', gameKey)
    .maybeSingle()
  if (error) throw error
  return data as GameConfig | null
}

export async function loadComments(gameKey: GameConfig['game_key'], limit = 25): Promise<YouTubeComment[]> {
  const { data, error } = await supabase
    .from('youtube_comments')
    .select('*')
    .eq('game_key', gameKey)
    .order('like_count', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as YouTubeComment[]
}

export async function loadAllPicks(season?: number): Promise<Array<{ profile: PlayerProfile; picks: UserAppData | null }>> {
  const s = season ?? await getCurrentSeason()
  // Two queries because PostgREST embedded selects can't filter the embedded
  // child table by an arbitrary value with the JS client cleanly.
  const [{ data: players, error: pErr }, { data: picksRows, error: ppErr }] = await Promise.all([
    supabase
      .from('players')
      .select('*')
      .order('is_show_account', { ascending: false })
      .order('display_name', { ascending: true }),
    supabase
      .from('player_picks')
      .select('player_id, data')
      .eq('season', s),
  ])
  if (pErr) throw pErr
  if (ppErr) throw ppErr
  const picksByPlayer = new Map<string, UserAppData | null>()
  for (const r of picksRows ?? []) {
    picksByPlayer.set((r as { player_id: string }).player_id, (r as { data: UserAppData }).data ?? null)
  }
  return (players ?? []).map(p => ({
    profile: p as PlayerProfile,
    picks: picksByPlayer.get((p as { id: string }).id) ?? null,
  }))
}

// ---------------------------------------------------------------------------
// Legacy single-row API (kept for migration only — do NOT use in new code)
// ---------------------------------------------------------------------------

/** @deprecated reads the legacy `draft_room` row (Scott + Ty combined). */
export async function loadLegacyData(): Promise<AppData | null> {
  const { data, error } = await supabase
    .from('draft_room')
    .select('data')
    .eq('id', 1)
    .single()
  if (error) throw error
  return (data?.data ?? null) as AppData | null
}

/** @deprecated writes the legacy `draft_room` row. Only used by `update-stats` job during cutover. */
export async function saveLegacyData(gameData: AppData): Promise<void> {
  const { error } = await supabase
    .from('draft_room')
    .update({ data: gameData, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) throw error
}

// Phase 1 compat aliases — existing components import these names. Will be
// removed in Phase 2 once components consume per-user picks directly.
export const loadData = loadLegacyData
export const saveData = saveLegacyData
