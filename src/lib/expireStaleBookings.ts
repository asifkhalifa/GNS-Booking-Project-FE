import { getDb } from '@/lib/firebase-admin'
import { HOLD_AND_UNPAID_RELEASE_MS } from '@/lib/holdConstants'

/** Avoid running the full expiry scan on every API request (speeds up seat reads). */
let lastExpireAt = 0
const DEFAULT_EXPIRE_INTERVAL_MS = 45_000

/**
 * - **UNPAID (legacy):** older than {@link HOLD_AND_UNPAID_RELEASE_MS} from `createdAt` — release seats and delete booking.
 * - **PAYMENT_PENDING:** not auto-expired here (user flow = waiting for admin approval; admin cancels or confirms via other APIs).
 *
 * **PAID** is never changed.
 */
export async function expireStaleBookings(): Promise<void> {
  const now = Date.now()
  const minGap = Number(process.env.EXPIRE_BOOKINGS_MIN_INTERVAL_MS || String(DEFAULT_EXPIRE_INTERVAL_MS))
  if (Number.isFinite(minGap) && minGap > 0 && now - lastExpireAt < minGap) {
    return
  }

  const db = getDb()
  const threshold = now - HOLD_AND_UNPAID_RELEASE_MS

  const unpaidSnap = await db.collection('bookings').where('status', '==', 'UNPAID').get()
  for (const doc of unpaidSnap.docs) {
    const d = doc.data() as { createdAt?: number; status?: string }
    if (d.status !== 'UNPAID') continue
    if ((d.createdAt ?? 0) >= threshold) continue
    try {
      await db.runTransaction(async (t) => {
        const fresh = await t.get(doc.ref)
        if (!fresh.exists) return
        const fd = fresh.data() as { createdAt?: number; seats?: string[]; status?: string }
        if (fd.status !== 'UNPAID') return
        if ((fd.createdAt ?? 0) >= threshold) return

        const sns = fd.seats ?? []
        const seatRefs = sns.map((sn) => db.collection('seats').doc(sn))
        const seatSnaps = await Promise.all(seatRefs.map((ref) => t.get(ref)))
        for (let i = 0; i < sns.length; i++) {
          const ref = seatRefs[i]!
          const s = seatSnaps[i]!
          if (s.exists && s.data()?.status === 'BOOKED') {
            t.update(ref, { status: 'AVAILABLE' })
          }
          t.delete(db.collection('locks').doc(sns[i]!))
        }
        t.delete(doc.ref)
      })
    } catch (e) {
      console.error('[expireStaleBookings UNPAID]', doc.id, e)
    }
  }

  lastExpireAt = Date.now()
}

/** @deprecated Use {@link expireStaleBookings} */
export async function expireStaleUnpaidBookings(): Promise<void> {
  return expireStaleBookings()
}
