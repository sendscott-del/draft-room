#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs'

const inPath = process.argv[2]
const outPath = process.argv[3] ?? inPath.replace(/\.vtt$/, '.txt')
if (!inPath) {
  console.error('usage: clean-vtt.mjs <input.vtt> [output.txt]')
  process.exit(1)
}

const raw = readFileSync(inPath, 'utf8')
const lines = raw.split(/\r?\n/)

const seen = new Set()
const out = []

for (const line of lines) {
  if (!line.trim()) continue
  if (line.startsWith('WEBVTT')) continue
  if (line.startsWith('Kind:') || line.startsWith('Language:')) continue
  if (/^\d{2}:\d{2}:\d{2}\.\d{3}\s+--&gt;|^\d{2}:\d{2}:\d{2}\.\d{3}\s+-->/.test(line)) continue
  const cleaned = line
    .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '')
    .replace(/<\/?c[^>]*>/g, '')
    .replace(/&gt;&gt;\s*/g, '\n>> ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
  if (!cleaned) continue
  if (seen.has(cleaned)) continue
  seen.add(cleaned)
  out.push(cleaned)
}

writeFileSync(outPath, out.join('\n') + '\n')
console.log(`wrote ${outPath} (${out.length} unique lines)`)
