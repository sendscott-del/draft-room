import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { UserAppData, PlayerProfile } from '../types'
import { useAuth } from '../lib/auth-context'
import { loadAllPicks, saveMyPicks, getCurrentSeason, listSeasons } from '../lib/supabase'
import { EMPTY_USER_PICKS } from '../lib/data-adapter'
import { computeScoredRows } from '../lib/leaderboard-scoring'
import { getCountdownState, type CountdownState } from '../lib/locks'

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

  // Reload picks whenever the selected season (or signed-in user) changes.
  // Important: depend on `profile?.id` (a primitive) — not `profile` (an
  // object whose reference changes every time Supabase refreshes the auth
  // token). Otherwise the picks blob would re-fetch every ~50 min and
  // overwrite any in-flight local edits.
  const profileId = profile?.id
  useEffect(() => {
    if (!profileId) return
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
        const me = all.find(r => r.profile.id === profileId)
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
  }, [profileId, selectedSeason])

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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 14,
          color: '#0E1B2C',
          background: '#F2EAD3',
        }}
      >
        <div
          aria-hidden
          style={{
            width: 72,
            height: 72,
            background: '#C8332C',
            color: '#F2EAD3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '3px solid #F2EAD3',
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 36,
            lineHeight: 1,
            boxShadow: '4px 4px 0 #D4A24C',
            transform: 'rotate(-3deg)',
          }}
        >
          DR
        </div>
        <div className="brand-display" style={{ fontSize: 28, color: '#0E1B2C', letterSpacing: '0.04em' }}>
          Draft <span style={{ color: '#D4A24C' }}>Room.</span>
        </div>
        <div
          className="label"
          style={{ fontSize: 11, color: '#4A5466', letterSpacing: '0.22em' }}
        >
          {!profile ? 'Resolving profile…' : 'Loading picks…'}
        </div>
      </div>
    )
  }

  if (syncStatus === 'error' && rows.length === 0) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
          color: '#0E1B2C',
          padding: 24,
          textAlign: 'center',
          background: '#F2EAD3',
        }}
      >
        <div style={{ fontSize: 32 }}>⚠️</div>
        <div className="serif" style={{ fontSize: 14, color: '#C8332C' }}>
          Couldn't load draft room data. Open browser console for details.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 8,
            padding: '10px 16px',
            background: '#0E1B2C',
            border: '1.5px solid #0E1B2C',
            borderRadius: 0,
            color: '#F2EAD3',
            cursor: 'pointer',
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            boxShadow: '3px 3px 0 #0E1B2C',
          }}
        >
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
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 18px 80px' }}>
        {renderPage()}
      </main>
    </>
  )
}

