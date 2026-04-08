interface LockBannerProps {
  message?: string
}

export default function LockBanner({ message }: LockBannerProps) {
  return (
    <div
      style={{
        background: 'rgba(251,191,36,0.1)',
        border: '1px solid rgba(251,191,36,0.3)',
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        color: '#fbbf24',
        fontWeight: 700,
      }}
    >
      {message || '\u{1F512} Picks are locked'}
    </div>
  )
}
