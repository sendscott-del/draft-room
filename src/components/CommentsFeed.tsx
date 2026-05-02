import { useEffect, useState } from 'react'
import { loadComments, loadGameConfig } from '../lib/supabase'
import type { GameConfig, YouTubeComment } from '../types'
import LowerThird from './ui/LowerThird'
import Badge from './ui/Badge'

interface Props {
  gameKey: GameConfig['game_key']
}

export default function CommentsFeed({ gameKey }: Props) {
  const [comments, setComments] = useState<YouTubeComment[]>([])
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([loadComments(gameKey), loadGameConfig(gameKey)])
      .then(([c, g]) => {
        if (cancelled) return
        setComments(c)
        setConfig(g)
        setLoading(false)
      })
      .catch(e => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'failed')
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [gameKey])

  const videoIds = config?.source_video_ids ?? []

  return (
    <div style={{ marginTop: 32 }}>
      <LowerThird
        kicker="From the Show"
        title="Talkin' Baseball Discussion"
        meta={comments.length > 0 ? <Badge variant="gold">{comments.length}</Badge> : undefined}
      />

      {videoIds.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {videoIds.map(id => (
            <a
              key={id}
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                background: '#E9DFC2',
                border: '1.5px solid #0E1B2C',
                borderRadius: 0,
                color: '#0E1B2C',
                fontFamily: "'Oswald', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textDecoration: 'none',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              <img
                src={`https://img.youtube.com/vi/${id}/default.jpg`}
                alt=""
                style={{ width: 60, height: 36, objectFit: 'cover', border: '1.5px solid #0E1B2C' }}
              />
              <span>▶ Watch episode</span>
            </a>
          ))}
        </div>
      )}

      {loading && (
        <div className="serif" style={{ color: '#4A5466', fontSize: 13, padding: '14px 0', textAlign: 'center' }}>
          Loading comments…
        </div>
      )}
      {error && (
        <div className="serif" style={{ color: '#C8332C', fontSize: 13, padding: '14px 0' }}>
          Couldn't load comments: {error}
        </div>
      )}
      {!loading && !error && comments.length === 0 && (
        <div
          className="serif"
          style={{
            color: '#4A5466',
            fontSize: 13,
            padding: '14px 0',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          No comments yet — run <code className="mono" style={{ background: '#E9DFC2', border: '1.5px solid #0E1B2C', padding: '1px 5px' }}>/api/youtube-comments</code> to populate.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {comments.map(c => <CommentRow key={c.comment_id} c={c} />)}
      </div>
    </div>
  )
}

function CommentRow({ c }: { c: YouTubeComment }) {
  const isHost = !!c.author_handle
  return (
    <div
      style={{
        padding: '10px 12px',
        background: isHost ? '#F2EAD3' : '#E9DFC2',
        border: '1.5px solid #0E1B2C',
        borderLeft: isHost ? '5px solid #C8332C' : '1.5px solid #0E1B2C',
        borderRadius: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span
          style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: '#0E1B2C',
          }}
        >
          {c.author_display_name ?? 'anon'}
        </span>
        {isHost && <Badge variant="red">Show</Badge>}
        {c.like_count > 0 && (
          <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: '#4A5466' }}>
            ♥ {c.like_count}
          </span>
        )}
      </div>
      <div
        className="serif"
        style={{ fontSize: 13, color: '#0E1B2C', lineHeight: 1.45 }}
        // YouTube returns mostly safe HTML (it's their sanitized output for comments).
        // We render it directly so emoji and links survive.
        dangerouslySetInnerHTML={{ __html: c.text_html ?? c.text_plain ?? '' }}
      />
    </div>
  )
}
