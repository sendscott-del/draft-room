import { createClient } from '@supabase/supabase-js'

// Vercel Function — Node.js runtime (Fluid Compute default).
//
// Fetches top-level comments for every video listed in `games_config.source_video_ids`
// and upserts them into the `youtube_comments` table tagged with the game key.
//
// Usage:
//   GET /api/youtube-comments              — refresh all games
//   GET /api/youtube-comments?game=cy      — refresh just one game
//
// Required env:
//   YOUTUBE_API_KEY              YouTube Data API v3 key
//   SUPABASE_URL                 Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY    Service role (bypass RLS)

const HOST_NAMES = new Map<string, string>([
  ['trevor plouffe',     'trevorplouffe'],
  ['plouffe',            'trevorplouffe'],
  ['jake storiale',      'jolly_olive'],
  ['jolly olive',        'jolly_olive'],
  ['storiale',           'jolly_olive'],
  ['jomboy',             'jomboy_'],
  ['jimmy o’brien', 'jomboy_'],
  ['jimmy obrien',       'jomboy_'],
  ['chris rose',         'chrisrosesports'],
  ['talkin’ baseball','talkinbaseball_'],
  ['talkin baseball',    'talkinbaseball_'],
  ['talking baseball',   'talkinbaseball_'],
])

function matchHostHandle(displayName: string | undefined): string | null {
  if (!displayName) return null
  const lower = displayName.toLowerCase()
  for (const [needle, handle] of HOST_NAMES) {
    if (lower.includes(needle)) return handle
  }
  return null
}

interface YTComment {
  id: string
  snippet: {
    videoId: string
    topLevelComment: {
      id: string
      snippet: {
        authorDisplayName: string
        authorChannelId?: { value: string }
        textDisplay: string
        textOriginal: string
        likeCount: number
        publishedAt: string
      }
    }
  }
}

async function fetchVideoComments(videoId: string, apiKey: string, max = 100) {
  const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('videoId', videoId)
  url.searchParams.set('maxResults', String(Math.min(max, 100)))
  url.searchParams.set('order', 'relevance')
  url.searchParams.set('textFormat', 'html')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`YouTube API ${res.status}: ${txt.slice(0, 300)}`)
  }
  const data = await res.json() as { items?: YTComment[] }
  return data.items ?? []
}

export default async function handler(req: Request) {
  const SUPA_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const YT_KEY = process.env.YOUTUBE_API_KEY || ''
  if (!SUPA_URL || !SUPA_KEY) {
    return json({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }, 500)
  }
  if (!YT_KEY) {
    return json({ error: 'Missing YOUTUBE_API_KEY' }, 500)
  }

  const url = new URL(req.url)
  const onlyGame = url.searchParams.get('game')
  const supabase = createClient(SUPA_URL, SUPA_KEY)
  const t0 = Date.now()
  const summary: Record<string, { videos: number; comments: number; hostMatches: number }> = {}

  let configQuery = supabase.from('games_config').select('game_key, source_video_ids')
  if (onlyGame) configQuery = configQuery.eq('game_key', onlyGame)
  const { data: games, error: gErr } = await configQuery
  if (gErr) return json({ error: gErr.message }, 500)

  type CommentRow = {
    comment_id: string
    video_id: string
    game_key: string
    author_channel_id: string | null
    author_handle: string | null
    author_display_name: string | null
    text_plain: string | null
    text_html: string | null
    published_at: string | null
    like_count: number
  }
  const rowsToUpsert: CommentRow[] = []

  for (const g of games ?? []) {
    const videos: string[] = (g.source_video_ids as string[]) ?? []
    summary[g.game_key] = { videos: videos.length, comments: 0, hostMatches: 0 }
    for (const videoId of videos) {
      try {
        const items = await fetchVideoComments(videoId, YT_KEY)
        for (const item of items) {
          const top = item.snippet.topLevelComment.snippet
          const channelId = top.authorChannelId?.value ?? null
          const handle = matchHostHandle(top.authorDisplayName)
          if (handle) summary[g.game_key].hostMatches++
          rowsToUpsert.push({
            comment_id: item.snippet.topLevelComment.id,
            video_id: videoId,
            game_key: g.game_key,
            author_channel_id: channelId,
            author_handle: handle,
            author_display_name: top.authorDisplayName,
            text_plain: top.textOriginal ?? stripHtml(top.textDisplay),
            text_html: top.textDisplay,
            published_at: top.publishedAt,
            like_count: top.likeCount ?? 0,
          })
          summary[g.game_key].comments++
        }
      } catch (e) {
        console.error(`fetch failed for ${g.game_key}/${videoId}:`, e)
      }
    }
  }

  if (rowsToUpsert.length > 0) {
    // Batch upserts in chunks of 200 to keep payloads small.
    for (let i = 0; i < rowsToUpsert.length; i += 200) {
      const chunk = rowsToUpsert.slice(i, i + 200)
      const { error } = await supabase
        .from('youtube_comments')
        .upsert(chunk, { onConflict: 'comment_id' })
      if (error) {
        console.error('upsert chunk failed:', error)
        return json({ error: `upsert failed: ${error.message}`, partial_summary: summary }, 500)
      }
    }
  }

  return json({
    success: true,
    elapsed_ms: Date.now() - t0,
    summary,
    upserted: rowsToUpsert.length,
  })
}

function stripHtml(s: string | undefined): string {
  if (!s) return ''
  return s.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, ' ').trim()
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
