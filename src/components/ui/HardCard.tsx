import type { ReactNode, CSSProperties } from 'react'

interface Props {
  children: ReactNode
  /** Studio Talk variant: 'paper' (cream-2 + 1.5px border, no shadow),
   *  'shadow' (cream-2 + 1.5px border + 4px hard navy drop-shadow),
   *  'flag' (cream + red top edge — used for leader callouts). */
  variant?: 'paper' | 'shadow' | 'flag'
  /** Per-game accent applied as a 4px left bar (used on game-result cards). */
  accent?: string
  style?: CSSProperties
  className?: string
  onClick?: () => void
  title?: string
}

export default function HardCard({
  children, variant = 'paper', accent, style, className, onClick, title,
}: Props) {
  const base: CSSProperties = {
    background: variant === 'flag' ? '#F2EAD3' : '#E9DFC2',
    border: '1.5px solid #0E1B2C',
    borderRadius: 0,
    padding: 14,
    position: 'relative',
    color: '#0E1B2C',
    ...(variant === 'shadow' ? { boxShadow: '4px 4px 0 #0E1B2C' } : {}),
    ...(accent ? { borderLeft: `5px solid ${accent}` } : {}),
    ...(onClick ? { cursor: 'pointer' } : {}),
    ...style,
  }
  return (
    <div className={className} title={title} onClick={onClick} style={base}>
      {children}
    </div>
  )
}
