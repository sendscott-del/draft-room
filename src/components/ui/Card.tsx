import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  /** Optional left-bar accent (per-game color). When omitted, the card is
   *  a neutral cream-2 paper card with a 1.5px navy border. */
  borderColor?: string
  style?: React.CSSProperties
}

/** Game-page card — hard-edged, cream-on-cream paper with a 1.5px navy
 *  border. Optionally accepts a `borderColor` which is rendered as a 5px
 *  left bar (used to color a card by game accent or scoring outcome). */
export default function Card({ children, borderColor, style }: CardProps) {
  return (
    <div
      style={{
        background: '#E9DFC2',
        border: '1.5px solid #0E1B2C',
        borderRadius: 0,
        padding: 12,
        marginBottom: 8,
        color: '#0E1B2C',
        position: 'relative',
        ...(borderColor ? { borderLeft: `5px solid ${borderColor}` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
