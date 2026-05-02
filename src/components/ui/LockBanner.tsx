interface LockBannerProps {
  message?: string
}

/** Lock banner — gold paper with hard navy border and Oswald copy. Replaces
 *  the soft amber alert from the previous design. */
export default function LockBanner({ message }: LockBannerProps) {
  return (
    <div
      style={{
        background: '#D4A24C',
        border: '1.5px solid #0E1B2C',
        borderLeft: '6px solid #0E1B2C',
        padding: '10px 14px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: "'Oswald', sans-serif",
        fontSize: 12,
        color: '#0E1B2C',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.16em',
      }}
    >
      <span aria-hidden style={{ fontSize: 14 }}>{'\u{1F512}'}</span>
      <span>{message ? message.replace(/^\u{1F512}\s*/u, '') : 'Picks are locked'}</span>
    </div>
  )
}
