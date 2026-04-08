import { useState, useEffect, useRef, useCallback } from 'react'
import type { AppData } from './types'
import { DEFAULT_DATA } from './data/defaults'
import { loadData, saveData } from './lib/supabase'
import { getCountdownState } from './lib/locks'
import type { CountdownState } from './lib/locks'
import Header from './components/Header'
import Nav from './components/Nav'
import Leaderboard from './components/Leaderboard'
import FreeAgent from './components/games/FreeAgent'
import CyYoung from './components/games/CyYoung'
import PositionUnit from './components/games/PositionUnit'
import HRTeam from './components/games/HRTeam'
import TradeDeadline from './components/games/TradeDeadline'
import Awards from './components/games/Awards'
import WinOU from './components/games/WinOU'
import Rules from './components/games/Rules'

// Deep merge: overlay saved data onto defaults so new fields always get defaults
function deepMerge<T>(defaults: T, saved: Partial<T>): T {
  if (!saved) return defaults
  if (typeof defaults !== 'object' || defaults === null) return (saved ?? defaults) as T
  if (Array.isArray(defaults)) return (saved as T) ?? defaults

  const result = { ...defaults } as Record<string, unknown>
  for (const key of Object.keys(defaults as Record<string, unknown>)) {
    if (key in (saved as Record<string, unknown>)) {
      const dVal = (defaults as Record<string, unknown>)[key]
      const sVal = (saved as Record<string, unknown>)[key]
      if (typeof dVal === 'object' && dVal !== null && !Array.isArray(dVal) && typeof sVal === 'object' && sVal !== null && !Array.isArray(sVal)) {
        result[key] = deepMerge(dVal, sVal)
      } else {
        result[key] = sVal
      }
    }
  }
  return result as T
}

export default function App() {
  const [data, setData] = useState<AppData>(DEFAULT_DATA)
  const [syncStatus, setSyncStatus] = useState<'loading' | 'saved' | 'saving' | 'error'>('loading')
  const [activePage, setActivePage] = useState('lb')
  const [countdown, setCountdown] = useState<CountdownState>(getCountdownState())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isInitialLoad = useRef(true)

  // Load data on mount
  useEffect(() => {
    loadData()
      .then(d => {
        if (d && d.fa) {
          setData(deepMerge(DEFAULT_DATA, d))
        } else {
          // No saved data — save defaults to Supabase
          saveData(DEFAULT_DATA).catch(() => {})
        }
        setSyncStatus('saved')
        isInitialLoad.current = false
      })
      .catch(() => {
        // First time or error — save defaults
        saveData(DEFAULT_DATA).catch(() => {})
        setSyncStatus('saved')
        isInitialLoad.current = false
      })
  }, [])

  // Auto-save on data change (debounced 800ms)
  useEffect(() => {
    if (isInitialLoad.current) return
    if (syncStatus === 'loading') return
    setSyncStatus('saving')
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveData(data)
        .then(() => setSyncStatus('saved'))
        .catch(() => setSyncStatus('error'))
    }, 800)
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer - tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownState())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Updater function passed to child components
  const handleSetData = useCallback((fn: (d: AppData) => AppData) => {
    setData(prev => fn(prev))
  }, [])

  // Loading state
  if (syncStatus === 'loading' && isInitialLoad.current) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 32 }}>{'\u26BE'}</div>
        <div style={{ fontSize: 14, color: '#64748b', letterSpacing: 2 }}>LOADING DRAFT ROOM...</div>
      </div>
    )
  }

  const renderPage = () => {
    switch (activePage) {
      case 'lb': return <Leaderboard data={data} />
      case 'fa': return <FreeAgent data={data} setData={handleSetData} />
      case 'cy': return <CyYoung data={data} setData={handleSetData} />
      case 'pu': return <PositionUnit data={data} setData={handleSetData} />
      case 'hr': return <HRTeam data={data} setData={handleSetData} />
      case 'td': return <TradeDeadline data={data} setData={handleSetData} />
      case 'aw': return <Awards data={data} setData={handleSetData} />
      case 'ou': return <WinOU data={data} setData={handleSetData} />
      case 'ru': return <Rules />
      default: return <Leaderboard data={data} />
    }
  }

  return (
    <>
      <Header data={data} syncStatus={syncStatus} countdown={countdown} onStatsUpdated={() => {
        // Reload data from Supabase after stats update
        loadData().then(d => {
          if (d && d.fa) setData(deepMerge(DEFAULT_DATA, d))
        })
      }} />
      <Nav activePage={activePage} onPageChange={setActivePage} />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '18px 12px 60px' }}>
        {renderPage()}
      </div>
    </>
  )
}
