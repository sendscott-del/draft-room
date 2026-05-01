#!/usr/bin/env node
/**
 * One-shot comment fetcher for local use. Mirrors the logic in
 * api/youtube-comments.ts but writes the result to a JSON file instead of
 * directly inserting (so we can review and bulk-insert via the Supabase MCP).
 *
 * Usage:
 *   YOUTUBE_API_KEY=... node scripts/fetch-comments-cli.mjs <output.json>
 *
 * Hardcodes the same game→videos map that lives in `games_config`.
 */

import { writeFileSync } from 'node:fs'

const YT_KEY = process.env.YOUTUBE_API_KEY
const outPath = process.argv[2] ?? 'transcripts/youtube-comments.json'

if (!YT_KEY) { console.error('Missing YOUTUBE_API_KEY'); process.exit(1) }

const VIDEOS_BY_GAME = {
  cy: ['qwDwKGbDKgw'],
  hr: ['w3G9bijc3jU'],
  pu: ['cTavWWawRJc'],
  fa: ['EFLh3NL_qv0'],
  ou: ['L3rIaH6VaHQ', 'Yk28bKL_eWI', 'szx6nlV8uOQ', '51SU5LEgnlE', 'vGmhBX-GOT8', '1qlPp-hqCZg'],
  ps: ['6l0tWCe1J3Y'],
}

const HOST_NAMES = new Map([
  ['trevor plouffe',     'trevorplouffe'],
  ['plouffe',            'trevorplouffe'],
  ['jake storiale',      'jolly_olive'],
  ['jolly olive',        'jolly_olive'],
  ['storiale',           'jolly_olive'],
  ['jomboy',             'jomboy_'],
  ['jimmy o',            'jomboy_'],
  ['chris rose',         'chrisrosesports'],
  ['talkin baseball',    'talkinbaseball_'],
  ['talkin’ baseball','talkinbaseball_'],
  ['talking baseball',   'talkinbaseball_'],
])

function matchHostHandle(displayName) {
  if (!displayName) return null
  const lower = displayName.toLowerCase()
  for (const [needle, handle] of HOST_NAMES) {
    if (lower.includes(needle)) return handle
  }
  return null
}

async function fetchVideoComments(videoId, max = 100) {
  const url = new URL('https://www.googleapis.com/youtube/v3/commentThreads')
  url.searchParams.set('part', 'snippet')
  url.searchParams.set('videoId', videoId)
  url.searchParams.set('maxResults', String(Math.min(max, 100)))
  url.searchParams.set('order', 'relevance')
  url.searchParams.set('textFormat', 'html')
  url.searchParams.set('key', YT_KEY)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`${videoId}: ${res.status} ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data.items ?? []
}

const all = []
for (const [game, videos] of Object.entries(VIDEOS_BY_GAME)) {
  for (const videoId of videos) {
    process.stderr.write(`fetching ${game}/${videoId}…\n`)
    try {
      const items = await fetchVideoComments(videoId)
      let hostHits = 0
      for (const item of items) {
        const top = item.snippet.topLevelComment.snippet
        const handle = matchHostHandle(top.authorDisplayName)
        if (handle) hostHits++
        all.push({
          comment_id: item.snippet.topLevelComment.id,
          video_id: videoId,
          game_key: game,
          author_channel_id: top.authorChannelId?.value ?? null,
          author_handle: handle,
          author_display_name: top.authorDisplayName ?? null,
          text_plain: top.textOriginal ?? null,
          text_html: top.textDisplay ?? null,
          published_at: top.publishedAt ?? null,
          like_count: top.likeCount ?? 0,
        })
      }
      process.stderr.write(`  ${items.length} comments (${hostHits} host)\n`)
    } catch (e) {
      process.stderr.write(`  failed: ${e.message}\n`)
    }
  }
}

writeFileSync(outPath, JSON.stringify(all, null, 2) + '\n')
process.stderr.write(`wrote ${outPath} (${all.length} rows)\n`)
