import { getDb } from '@/lib/firebase-admin'
import { ensureSeatsSeeded } from '@/lib/ensureSeats'
import { expireStaleBookings } from '@/lib/expireStaleBookings'
import type { Seat } from '@/modules/seat/types'

export async function listSeatsMerged(viewerEmail?: string | null): Promise<Seat[]> {
  await ensureSeatsSeeded()
  await expireStaleBookings()
  const db = getDb()
  const now = Date.now()

  async function getLocksForMerge() {
    try {
      return await db.collection('locks').where('expiresAt', '>', now).get()
    } catch (e) {
      console.warn('[seatMerge] active locks query failed; scanning all locks', e)
      return db.collection('locks').get()
    }
  }

  const [seatsSnap, locksSnap] = await Promise.all([db.collection('seats').get(), getLocksForMerge()])
  const lockMap = new Map<string, { email: string; expiresAt: number }>()
  locksSnap.forEach((d) => {
    const x = d.data() as { email?: string; expiresAt?: number }
    if (x.expiresAt && x.expiresAt > now && x.email) {
      lockMap.set(d.id, { email: x.email.trim().toLowerCase(), expiresAt: x.expiresAt })
    }
  })
  const viewer = viewerEmail?.trim().toLowerCase() || ''
  const out: Seat[] = []
  seatsSnap.forEach((d) => {
    const s = d.data() as Seat
    const lock = lockMap.get(d.id)
    let status = String(s.status || 'AVAILABLE')
    if (status === 'AVAILABLE' && lock && lock.email !== viewer) {
      status = 'LOCKED'
    }
    out.push({
      ...s,
      seatNumber: d.id,
      rowName: String(s.rowName || '').toUpperCase(),
      section: s.section,
      price: Number(s.price) || 0,
      status,
    })
  })
  return out.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber))
}
