import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  supabase,
  getSession,
  onAuthChange,
  getMyProfile,
  signOut as libSignOut,
} from './supabase'
import type { PlayerProfile } from '../types'

type AuthState = {
  session: Session | null
  profile: PlayerProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(currentSession: Session | null) {
    if (!currentSession) {
      setProfile(null)
      return
    }
    try {
      const p = await Promise.race<PlayerProfile | null>([
        getMyProfile(currentSession.user.id),
        new Promise<PlayerProfile | null>((_, reject) =>
          setTimeout(() => reject(new Error('getMyProfile timed out after 8s')), 8000)
        ),
      ])
      setProfile(p)
    } catch (e) {
      console.error('failed to load profile', e)
      setProfile(null)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = await getSession()
      if (cancelled) return
      setSession(s)
      await loadProfile(s)
      setLoading(false)
    })()
    // Only re-fetch profile when the *user* changes (sign in / sign out).
    // TOKEN_REFRESHED + USER_UPDATED fire every ~50 min and were causing
    // downstream picks to refetch and any in-flight edits to clobber.
    const { data: sub } = onAuthChange(async (s) => {
      setSession(prev => {
        const prevId = prev?.user?.id
        const newId = s?.user?.id
        if (prevId === newId) return prev // keep ref stable to avoid downstream re-renders
        loadProfile(s)
        return s
      })
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // If a freshly-signed-up user is missing a player row (trigger lag / RLS edge
  // case), create one client-side as a fallback. Always re-attempt profile
  // load after — even if the insert was rejected by a unique-constraint
  // (profile already exists, just couldn't be read on the first attempt).
  useEffect(() => {
    if (loading) return
    if (!session?.user) return
    if (profile) return
    let cancelled = false
    ;(async () => {
      const meta = session.user.user_metadata as Record<string, unknown> | undefined
      const name =
        (typeof meta?.display_name === 'string' && meta.display_name) ||
        (typeof meta?.full_name === 'string' && meta.full_name) ||
        (typeof meta?.name === 'string' && meta.name) ||
        session.user.email?.split('@')[0] ||
        'Player'
      const { error } = await supabase
        .from('players')
        .insert({ user_id: session.user.id, display_name: name, is_public: true })
      if (cancelled) return
      if (error) {
        // 23505 = unique_violation (their row already exists). Re-fetch.
        if ((error as { code?: string }).code === '23505') {
          await loadProfile(session)
        } else {
          console.error('player insert failed', error)
        }
      } else {
        await loadProfile(session)
      }
    })()
    return () => { cancelled = true }
  }, [loading, session, profile])

  const refreshProfile = async () => loadProfile(session)
  const signOut = async () => {
    await libSignOut()
    setSession(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
