interface PillProps {
  text: string
}

/** Studio Talk "scoring pill" — small navy badge with cream text. Used to
 *  display per-pick scoring rules at the top of a game page. */
export function Pill({ text }: PillProps) {
  return (
    <span
      className="label"
      style={{
        background: '#0E1B2C',
        border: '1.5px solid #0E1B2C',
        borderRadius: 0,
        padding: '4px 9px',
        fontSize: 10,
        color: '#F2EAD3',
        marginRight: 6,
        marginBottom: 6,
        display: 'inline-block',
        letterSpacing: '0.16em',
      }}
    >
      {text}
    </span>
  )
}

export function Pills({ items }: { items: string[] }) {
  return (
    <div style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap' }}>
      {items.map((t, i) => (
        <Pill key={i} text={t} />
      ))}
    </div>
  )
}
