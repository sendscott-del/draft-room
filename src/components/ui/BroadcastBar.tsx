import type { ReactNode } from 'react'

interface Props {
  /** Left side: the "ON AIR" indicator + status text. */
  status?: ReactNode
  /** Right side: user/account info. */
  right?: ReactNode
  /** Live state — pulses the red dot. */
  live?: boolean
}

/** Top-of-page broadcast bar — navy with a thin red bottom rule and a
 *  red-cream-navy ticker hatch underneath. Always sits above the masthead. */
export default function BroadcastBar({ status, right, live = false }: Props) {
  return (
    <div
      style={{
        background: '#0E1B2C',
        color: '#F2EAD3',
        position: 'relative',
        borderBottom: '3px solid #C8332C',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -3,
          height: 3,
          background: 'repeating-linear-gradient(90deg, #C8332C 0 14px, #F2EAD3 14px 16px, #0E1B2C 16px 30px)',
        }}
      />
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          padding: '9px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontFamily: "'Oswald', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          fontSize: 11,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: '#C8332C',
            fontWeight: 700,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#C8332C',
              boxShadow: '0 0 0 3px rgba(200,51,44,0.25)',
              animation: live ? 'tb-pulse 1.6s infinite' : undefined,
            }}
          />
          {live ? 'On Air' : 'Studio'}
        </span>
        <span style={{ opacity: 0.35 }}>/</span>
        {status && <span>{status}</span>}
        {right && (
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              gap: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {right}
          </span>
        )}
      </div>
    </div>
  )
}
