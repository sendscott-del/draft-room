import { NAV } from '../data/constants'

interface NavProps {
  activePage: string
  onPageChange: (page: string) => void
}

export default function Nav({ activePage, onPageChange }: NavProps) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid rgba(255,255,255,0.09)',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 860,
          margin: '0 auto',
          display: 'flex',
          padding: '0 12px',
          whiteSpace: 'nowrap',
        }}
      >
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => onPageChange(n.id)}
            style={{
              padding: '10px 11px',
              border: 'none',
              cursor: 'pointer',
              background: 'transparent',
              whiteSpace: 'nowrap',
              borderBottom: `2px solid ${activePage === n.id ? '#fbbf24' : 'transparent'}`,
              color: activePage === n.id ? '#fbbf24' : '#64748b',
              fontSize: 12,
              fontWeight: 700,
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {n.l}
          </button>
        ))}
      </div>
    </div>
  )
}
