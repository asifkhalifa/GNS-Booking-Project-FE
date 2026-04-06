/**
 * Deletes all Firestore `seats` + `locks`, then writes the chart from `buildInitialSeats()`
 * (same data as your SQL: A/B/C/R/S blocked, D–Q priced).
 *
 * Usage (from project root):
 *   npm run apply-seat-chart
 *
 * Requires `.env.local` with Firebase credentials (e.g. FIREBASE_SERVICE_ACCOUNT_FILE=...).
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

async function main() {
  const { replaceAllSeatsFromSeed } = await import('../src/lib/ensureSeats')
  const { seatCount } = await replaceAllSeatsFromSeed()
  console.log('Done. Firestore seats replaced. Count:', seatCount)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
