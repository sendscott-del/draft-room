import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { UserAppData, PlayerProfile } from '../types'
import { useAuth } from '../lib/auth-context'
import { loadAllPicks, saveMyPicks, getCurrentSeason, listSeasons } from '../lib/supabase'
import { EMPTY_USER_PICKS } from '../lib/data-adapter'
import { computeScoredRows } from '../lib/leaderboard-scoring'
import { getCountdownState, type CountdownState } from '../lib/locks'
import { COLORS } from '../data/constants'

import UserBar from './UserBar'
import Header from './Header'
import Nav from './Nav'
import MultiLeaderboard from './MultiLeaderboard'
import FreeAgent from './games/FreeAgent'
import CyYoung from './games/CyYoung'
import PositionUnit from './games/PositionUnit'
import HRTeam from './games/HRTeam'
import TradeDeadline from './games/TradeDeadline'
import Awards from './games/Awards'
import WinOU from './games/WinOU'
import Postseason from './games/Postseason'
import Rules from './games/Rules'
import CommentsFeed from './CommentsFeed'
import type { PSPicks, GameConfig } from '../types'
import type { PlayerView } from './games/shared'

type SyncStatus = 'loading' | 'saved' | 'saving' | 'error'

type Row = { profile: PlayerProfile; picks: UserAppData | null }

export default function LiveAppView() {
  const { profile } = useAuth()
  const [rows, setRows] = useState<Row[]>([])
  const [myPicks, setMyPicks] = useState<UserAppData>(EMPTY_USER_PICKS)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading')
  const [activePage, setActivePage] = useState('lb')
  const [countdown, setCountdown] = useState<CountdownState>(getCountdownState())
  const [currentSeason, setCurrentSeason] = useState<number | null>(null)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([])
  const isInitialLoad = useRef(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isReadOnly = currentSeason != null && selectedSeason != null && selectedSeason !== currentSeason

  // Resolve current season + available seasons once
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [cur, all] = await Promise.all([getCurrentSeason(), listSeasons()])
        if (cancelled) return
        setCurrentSeason(cur)
        setAvailableSeasons(all.length ? all : [cur])
        setSelectedSeason(prev => prev ?? cur)
      } catch (e) {
        console.error('season fetch failed', e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Reload picks whenever the selected season (or profile) changes
  useEffect(() => {
    if (!profile) return
    if (selectedSeason == null) return
    let cancelled = false
    ;(async () => {
      try {
        type Loaded = Awaited<ReturnType<typeof loadAllPicks>>
        const all: Loaded = await Promise.race([
          loadAllPicks(selectedSeason),
          new Promise<Loaded>((_, reject) => setTimeout(() => reject(new Error('loadAllPicks timed out after 8s')), 8000)),
        ])
        if (cancelled) return
        setRows(all)
        const me = all.find(r => r.profile.id === profile.id)
        setMyPicks(me?.picks ?? EMPTY_USER_PICKS)
        setSyncStatus('saved')
        isInitialLoad.current = false
      } catch (e) {
        console.error('initial picks load failed', e)
        setSyncStatus('error')
        isInitialLoad.current = false
      }
    })()
    return () => { cancelled = true }
  }, [profile, selectedSeason])

  // Auto-save on myPicks change (debounced 800ms). Skipped when viewing a
  // past season (read-only) so historical picks don't get overwritten.
  useEffect(() => {
    if (isInitialLoad.current) return
    if (syncStatus === 'loading') return
    if (isReadOnly) return
    if (selectedSeason == null) return
    setSyncStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveMyPicks(myPicks, selectedSeason)
        .then(() => setSyncStatus('saved'))
        .catch((e) => {
          console.error('save failed', e)
          setSyncStatus('error')
        })
    }, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [myPicks]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown ticker
  useEffect(() => {
    const interval = setInterval(() => setCountdown(getCountdownState()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Build the multi-player view: every visible player + their picks, with
  // the current user's row replaced by the in-memory `myPicks` so edits
  // appear instantly without a database round trip.
  const playerViews = useMemo<PlayerView[]>(() => {
    return rows
      .filter(r => r.picks)
      .map(r => ({
        profile: r.profile,
        picks: r.profile.id === profile?.id ? myPicks : r.picks!,
        isCurrentUser: r.profile.id === profile?.id,
      }))
  }, [rows, myPicks, profile?.id])

  // Single source of truth for both Header and Standings totals.
  const scoredRows = useMemo(() => {
    const liveRows = rows.map(r =>
      r.profile.id === profile?.id ? { profile: r.profile, picks: myPicks } : r
    )
    return computeScoredRows(liveRows)
  }, [rows, myPicks, profile?.id])

  const myScored = scoredRows.find(r => r.profile.id === profile?.id)
  const topOther = scoredRows.find(r => r.profile.id !== profile?.id)

  // Edit handler for the user's own picks (passed to game components).
  const editMine = useCallback((fn: (mine: UserAppData) => UserAppData) => {
    setMyPicks(prev => fn(prev))
  }, [])

  // Postseason picks live on the same myPicks blob.
  const handleSetPSPicks = useCallback((next: PSPicks) => {
    setMyPicks(prev => ({ ...prev, ps: next }))
  }, [])

  if (!profile || (syncStatus === 'loading' && isInitialLoad.current)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, color: COLORS.text }}>
        <div style={{ width: 56, height: 56, color: COLORS.gold }}>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
            <g stroke="currentColor" strokeWidth="5.5" strokeLinecap="round">
              <path d="M10 54 L48 16" />
              <path d="M16 10 L54 48" />
            </g>
            <circle cx="48" cy="16" r="5" fill="currentColor" />
            <circle cx="54" cy="48" r="5" fill="currentColor" />
          </svg>
        </div>
        <div className="brand-display" style={{ fontSize: 22, color: COLORS.text, letterSpacing: 3 }}>Draft Room</div>
        <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: 2 }}>
          {!profile ? 'RESOLVING PROFILE…' : 'LOADING PICKS…'}
        </div>
      </div>
    )
  }

  if (syncStatus === 'error' && rows.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#f1f5f9', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 32 }}>{'⚠️'}</div>
        <div style={{ fontSize: 14, color: '#fca5a5' }}>
          Couldn't load draft room data. Open browser console for details.
        </div>
        <button onClick={() => window.location.reload()} style={{ marginTop: 8, padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#f1f5f9', cursor: 'pointer' }}>
          Reload
        </button>
      </div>
    )
  }

  const myProfile = profile

  const GAME_TABS: GameConfig['game_key'][] = ['fa','cy','pu','hr','td','aw','ou','ps']
  const isGameTab = (GAME_TABS as string[]).includes(activePage)

  const renderPage = () => {
    let body: React.ReactNode = null
    switch (activePage) {
      case 'lb': return (
        <MultiLeaderboard
          rows={rows}
          myProfileId={myProfile.id}
          compareId={null}
          onSelectCompare={() => { /* compare-toggle deprecated; standings are the comparison */ }}
        />
      )
      case 'fa': body = <FreeAgent players={playerViews} onEditMine={editMine} />; break
      case 'cy': body = <CyYoung players={playerViews} onEditMine={editMine} />; break
      case 'pu': body = <PositionUnit players={playerViews} onEditMine={editMine} />; break
      case 'hr': body = <HRTeam players={playerViews} onEditMine={editMine} />; break
      case 'td': body = <TradeDeadline players={playerViews} onEditMine={editMine} />; break
      case 'aw': body = <Awards players={playerViews} onEditMine={editMine} />; break
      case 'ou': body = <WinOU players={playerViews} onEditMine={editMine} />; break
      case 'ps': body = (
        <Postseason
          players={playerViews}
          onEditMine={(next) => handleSetPSPicks(next)}
        />
      ); break
      case 'ru': return <Rules />
      default: return null
    }
    return (
      <>
        {body}
        {isGameTab && <CommentsFeed gameKey={activePage as GameConfig['game_key']} />}
      </>
    )
  }

  return (
    <>
      <UserBar
        selectedSeason={selectedSeason}
        currentSeason={currentSeason}
        availableSeasons={availableSeasons}
        onSelectSeason={s => setSelectedSeason(s)}
      />
      <Header
        syncStatus={syncStatus}
        countdown={countdown}
        leftLabel={myProfile.display_name}
        rightLabel={topOther?.profile.display_name ?? '—'}
        leftTotal={myScored?.total ?? 0}
        rightTotal={topOther?.total ?? 0}
        hasProjection={(myScored?.hasProj ?? false) || (topOther?.hasProj ?? false)}
        onStatsUpdated={async () => {
          // Re-fetch every player's picks after the stats job runs.
          try {
            const all = await loadAllPicks()
            setRows(all)
            const me = all.find(r => r.profile.id === myProfile.id)
            if (me?.picks) setMyPicks(me.picks)
          } catch (e) { console.error('refresh after stats failed', e) }
        }}
      />
      <Nav activePage={activePage} onPageChange={setActivePage} />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '18px 12px 60px' }}>
        {renderPage()}
      </div>
    </>
  )
}

