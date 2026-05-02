import { NAV } from '../data/constants'

interface NavProps {
  activePage: string
  onPageChange: (page: string) => void
  /** Optional per-tab pick counts shown as a small mono chip after the label. */
  counts?: Partial<Record<string, number>>
}

/** Studio Talk nav — cream-2 strip with hard navy bottom border. Active
 *  tab gets a 3px studio-red underline; inactive tabs are muted ink. */
export default function Nav({ activePage, onPageChange, counts }: NavProps) {
  return (
    <nav
      style={{
        background: '#E9DFC2',
        borderBottom: '2px solid #0E1B2C',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'flex',
          padding: '0 12px',
          whiteSpace: 'nowrap',
          gap: 0,
        }}
      >
        {NAV.map(n => {
          const isActive = activePage === n.id
          const count = counts?.[n.id]
          return (
            <button
              key={n.id}
              onClick={() => onPageChange(n.id)}
              style={{
                padding: '13px 14px',
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                whiteSpace: 'nowrap',
                borderBottom: `3px solid ${isActive ? '#C8332C' : 'transparent'}`,
                marginBottom: -2,
                color: isActive ? '#0E1B2C' : '#4A5466',
                fontSize: 12,
                fontFamily: "'Oswald', sans-serif",
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                transition: 'color 0.12s ease',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#0E1B2C' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#4A5466' }}
            >
              {n.l}
              {count != null && count > 0 && (
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: '#4A5466',
                    marginLeft: 6,
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
