import { useState } from 'react'

interface InfoPopupProps {
  title: string
  children: React.ReactNode
}

/** Studio Talk info popup — a small "i" button that opens a cream paper
 *  modal with hard navy borders and a 4px drop shadow. */
export default function InfoPopup({ title, children }: InfoPopupProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: '#0E1B2C',
          border: '1.5px solid #0E1B2C',
          borderRadius: 0,
          width: 18,
          height: 18,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 700,
          color: '#F2EAD3',
          fontFamily: "'Oswald', sans-serif",
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
            background: 'rgba(14,27,44,0.7)',
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
              background: '#F2EAD3',
              border: '1.5px solid #0E1B2C',
              borderRadius: 0,
              padding: '20px 24px',
              maxWidth: 480,
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              color: '#0E1B2C',
              boxShadow: '6px 6px 0 #0E1B2C',
              fontFamily: "'Roboto Slab', serif",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1.5px solid #0E1B2C', paddingBottom: 10 }}>
              <div
                className="brand-display"
                style={{ fontSize: 18, color: '#0E1B2C', letterSpacing: '0.04em' }}
              >
                {title}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: '#0E1B2C',
                  border: '1.5px solid #0E1B2C',
                  borderRadius: 0,
                  color: '#F2EAD3',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '2px 8px',
                  fontFamily: "'Oswald', sans-serif",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#0E1B2C' }}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
