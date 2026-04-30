import { useEffect, useState } from 'react'
import { loadComments, loadGameConfig } from '../lib/supabase'
import type { GameConfig, YouTubeComment } from '../types'
import { COLORS } from '../data/constants'

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
    <div style={{ marginTop: 28 }}>
      <div style={{
        fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
        color: COLORS.gold, fontWeight: 800, marginBottom: 8,
        paddingBottom: 5, borderBottom: `1px solid ${COLORS.border}`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>{'\u{1F3A4}'}</span>
        Talkin' Baseball Discussion
      </div>

      {videoIds.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {videoIds.map(id => (
            <a
              key={id}
              href={`https://www.youtube.com/watch?v=${id}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', background: COLORS.cardBg,
                border: `1px solid ${COLORS.border}`, borderRadius: 8,
                color: COLORS.text, fontSize: 11, fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <img
                src={`https://img.youtube.com/vi/${id}/default.jpg`}
                alt=""
                style={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 4 }}
              />
              <span>{'▶'} Watch episode</span>
            </a>
          ))}
        </div>
      )}

      {loading && (
        <div style={{ color: COLORS.muted, fontSize: 12, padding: '14px 0', textAlign: 'center' }}>
          Loading comments…
        </div>
      )}
      {error && (
        <div style={{ color: '#e45b5b', fontSize: 12, padding: '14px 0' }}>
          Couldn't load comments: {error}
        </div>
      )}
      {!loading && !error && comments.length === 0 && (
        <div style={{ color: COLORS.muted, fontSize: 12, padding: '14px 0', textAlign: 'center' }}>
          No comments yet — run <code style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 3 }}>/api/youtube-comments</code> to populate.
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
    <div style={{
      padding: '8px 10px',
      background: isHost ? 'rgba(232,181,74,0.06)' : COLORS.cardBg,
      border: `1px solid ${isHost ? 'rgba(232,181,74,0.3)' : COLORS.border}`,
      borderRadius: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 12, color: isHost ? COLORS.gold : COLORS.text }}>
          {c.author_display_name ?? 'anon'}
        </span>
        {isHost && (
          <span style={{ fontSize: 8, fontWeight: 800, letterSpacing: 1, color: COLORS.gold, background: 'rgba(232,181,74,0.15)', border: '1px solid rgba(232,181,74,0.4)', borderRadius: 8, padding: '1px 6px' }}>
            SHOW
          </span>
        )}
        {c.like_count > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 11, color: COLORS.muted2 }}>
            {'\u{2764}'} {c.like_count}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: COLORS.text, lineHeight: 1.45 }}
           // YouTube returns mostly safe HTML (it's their sanitized output for comments).
           // We render it directly so emoji and links survive.
           dangerouslySetInnerHTML={{ __html: c.text_html ?? c.text_plain ?? '' }}
      />
    </div>
  )
}
