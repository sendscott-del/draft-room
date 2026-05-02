import type { ReactNode } from 'react'

export type BadgeVariant =
  | 'default'    // cream bg, navy border, navy text
  | 'final'      // navy bg, cream text
  | 'interim'    // gold bg, navy text
  | 'live'       // red bg, cream text (pulses)
  | 'locked'     // cream bg, soft ink text
  | 'gold'       // gold bg, navy text
  | 'red'        // red bg, cream text (no pulse)
  | 'score'      // red bg, cream text — used for "+10 PTS" hits
  | 'ghost'      // transparent bg, navy border

interface Props {
  variant?: BadgeVariant
  children: ReactNode
  style?: React.CSSProperties
  title?: string
}

const VARIANT_STYLE: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#F2EAD3', color: '#0E1B2C' },
  final:   { background: '#0E1B2C', color: '#F2EAD3' },
  interim: { background: '#D4A24C', color: '#0E1B2C' },
  live:    { background: '#C8332C', color: '#F2EAD3' },
  locked:  { background: '#F2EAD3', color: '#4A5466' },
  gold:    { background: '#D4A24C', color: '#0E1B2C' },
  red:     { background: '#C8332C', color: '#F2EAD3' },
  score:   { background: '#C8332C', color: '#F2EAD3' },
  ghost:   { background: 'transparent', color: '#0E1B2C' },
}

export default function Badge({ variant = 'default', children, style, title }: Props) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: "'Oswald', sans-serif",
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
        fontSize: 10,
        padding: '3px 8px',
        border: '1.5px solid #0E1B2C',
        whiteSpace: 'nowrap',
        ...VARIANT_STYLE[variant],
        ...style,
      }}
    >
      {children}
    </span>
  )
}
