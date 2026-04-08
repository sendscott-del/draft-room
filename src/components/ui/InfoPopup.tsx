import { useState } from 'react'

interface InfoPopupProps {
  title: string
  children: React.ReactNode
}

export default function InfoPopup({ title, children }: InfoPopupProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          width: 18,
          height: 18,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 800,
          color: '#94a3b8',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          padding: 0,
          lineHeight: 1,
          verticalAlign: 'middle',
          flexShrink: 0,
        }}
      >
        i
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12,
              padding: '20px 24px',
              maxWidth: 480,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: '#f1f5f9',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{title}</div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 6,
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '2px 8px',
                  fontFamily: 'inherit',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#94a3b8' }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
