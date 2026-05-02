import type { ReactNode } from 'react'

interface Props {
  kicker?: ReactNode
  title: ReactNode
  meta?: ReactNode
  /** Left-bar accent color. Defaults to studio red. Use a per-game accent
   *  to colorize the marker on game pages. */
  accent?: string
  style?: React.CSSProperties
}

/** Broadcast lower-third — navy bar with a colored left edge, a small gold
 *  kicker and a chunky Oswald title. The standard section header on every
 *  game page in the Studio Talk redesign. */
export default function LowerThird({ kicker, title, meta, accent = '#C8332C', style }: Props) {
  return (
    <div
      style={{
        background: '#0E1B2C',
        color: '#F2EAD3',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        borderLeft: `6px solid ${accent}`,
        position: 'relative',
        overflow: 'hidden',
        marginBottom: 14,
        ...style,
      }}
    >
      {/* Halftone gold stripe in the right-hand corner — broadcast flair */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          left: 'auto',
          width: 70,
          background: 'repeating-linear-gradient(135deg, transparent 0 6px, rgba(212,162,76,0.18) 6px 12px)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        {kicker && (
          <div
            style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: 10,
              letterSpacing: '0.22em',
              color: '#D4A24C',
              marginBottom: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {kicker}
          </div>
        )}
        <div
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            textTransform: 'uppercase',
            fontSize: 22,
            letterSpacing: '0.04em',
            lineHeight: 1,
          }}
        >
          {title}
        </div>
      </div>
      {meta && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0, position: 'relative' }}>
          {meta}
        </div>
      )}
    </div>
  )
}
