interface SyncDotProps {
  status: 'loading' | 'saved' | 'saving' | 'error'
}

/** Sync-status dot — saved (outfield green), saving (gold), error (red),
 *  loading (muted). Sits in the masthead so users always have a save
 *  confidence cue. */
export default function SyncDot({ status }: SyncDotProps) {
  const color =
    status === 'saved'  ? '#4F6B3F' :
    status === 'saving' ? '#D4A24C' :
    status === 'error'  ? '#C8332C' :
                          '#6B7385'
  const label =
    status === 'saved'  ? 'Saved' :
    status === 'saving' ? 'Saving' :
    status === 'error'  ? 'Save error' :
                          'Loading'

  return (
    <span
      className="label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 10,
        color: '#F2EAD3',
        letterSpacing: '0.18em',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          boxShadow: status === 'saving' ? `0 0 0 3px ${color}33` : undefined,
        }}
      />
      <span style={{ color }}>{label}</span>
    </span>
  )
}
