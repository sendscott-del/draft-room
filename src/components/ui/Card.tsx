import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  borderColor?: string
  style?: React.CSSProperties
}

export default function Card({ children, borderColor, style }: CardProps) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${borderColor || 'rgba(255,255,255,0.09)'}`,
        borderRadius: 9,
        padding: 12,
        marginBottom: 9,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
