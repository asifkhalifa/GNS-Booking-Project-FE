#!/usr/bin/env node
/**
 * Calls POST /api/admin/reseed-seats on a running Next.js server.
 *
 * Usage:
 *   1. Set SEAT_RESEED_SECRET in `.env.local` (same value the server uses).
 *   2. Run `npm run dev` in another terminal.
 *   3. Run: npm run seed:seats
 *
 * Optional env:
 *   RESEED_URL — default http://127.0.0.1:3000
 */
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

function loadEnvLocal() {
  const p = join(process.cwd(), '.env.local')
  if (!existsSync(p)) return
  const text = readFileSync(p, 'utf8')
  for (let line of text.split('\n')) {
    line = line.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

loadEnvLocal()

const secret = process.env.SEAT_RESEED_SECRET?.trim()
if (!secret) {
  console.error('Missing SEAT_RESEED_SECRET in environment or .env.local')
  process.exit(1)
}

const base = (process.env.RESEED_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const url = `${base}/api/admin/reseed-seats`

const res = await fetch(url, {
  method: 'POST',
  headers: { 'x-seat-reseed-secret': secret },
})

const text = await res.text()
let json
try {
  json = JSON.parse(text)
} catch {
  json = { raw: text }
}

if (!res.ok) {
  console.error(res.status, json)
  process.exit(1)
}

console.log('OK', json)
