interface PillProps {
  text: string
}

export function Pill({ text }: PillProps) {
  return (
    <span
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 20,
        padding: '2px 9px',
        fontSize: 11,
        color: '#94a3b8',
        marginRight: 5,
        marginBottom: 4,
        display: 'inline-block',
      }}
    >
      {text}
    </span>
  )
}

export function Pills({ items }: { items: string[] }) {
  return (
    <div style={{ marginBottom: 10 }}>
      {items.map((t, i) => (
        <Pill key={i} text={t} />
      ))}
    </div>
  )
}
