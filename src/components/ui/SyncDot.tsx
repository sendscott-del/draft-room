interface SyncDotProps {
  status: 'loading' | 'saved' | 'saving' | 'error'
}

export default function SyncDot({ status }: SyncDotProps) {
  const color =
    status === 'saved' ? '#22c55e' :
    status === 'saving' ? '#f59e0b' :
    status === 'error' ? '#ef4444' :
    '#64748b'
  const label =
    status === 'saved' ? 'Saved' :
    status === 'saving' ? 'Saving...' :
    status === 'error' ? 'Save error' :
    'Loading...'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color }}>{label}</span>
    </div>
  )
}
