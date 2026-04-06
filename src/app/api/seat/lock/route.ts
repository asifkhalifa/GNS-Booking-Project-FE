import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { ensureSeatsSeeded } from '@/lib/ensureSeats'
import { expireStaleBookings } from '@/lib/expireStaleBookings'
import { HOLD_AND_UNPAID_RELEASE_MS } from '@/lib/holdConstants'

export const dynamic = 'force-dynamic'

/** Temporary hold on seats while the user completes confirm / OTP (same as old Redis lock idea). */
export async function POST(req: Request) {
  try {
    await ensureSeatsSeeded()
    await expireStaleBookings()
    const body = (await req.json()) as { email?: string; seatNumbers?: string[] }
    const email = String(body.email || '').trim().toLowerCase()
    const seatNumbers = Array.isArray(body.seatNumbers)
      ? body.seatNumbers.map((s) => String(s).trim()).filter(Boolean)
      : []
    if (!email || seatNumbers.length === 0) {
      return NextResponse.json({ message: 'email and seatNumbers required' }, { status: 400 })
    }
    const db = getDb()
    const expiresAt = Date.now() + HOLD_AND_UNPAID_RELEASE_MS
    await db.runTransaction(async (t) => {
      const seatRefs = seatNumbers.map((sn) => db.collection('seats').doc(sn))
      const lockRefs = seatNumbers.map((sn) => db.collection('locks').doc(sn))
      const reads: Promise<DocumentSnapshot>[] = []
      for (let i = 0; i < seatNumbers.length; i++) {
        reads.push(t.get(seatRefs[i]!))
        reads.push(t.get(lockRefs[i]!))
      }
      const snaps = await Promise.all(reads)

      const now = Date.now()
      for (let i = 0; i < seatNumbers.length; i++) {
        const seatSnap = snaps[i * 2]!
        const lockSnap = snaps[i * 2 + 1]!
        const sn = seatNumbers[i]!
        if (!seatSnap.exists) throw new Error(`Unknown seat ${sn}`)
        if (seatSnap.data()?.status !== 'AVAILABLE') throw new Error(`Seat ${sn} is not available`)
        const lock = lockSnap.data() as { email?: string; expiresAt?: number } | undefined
        if (lock && lock.expiresAt && lock.expiresAt > now && lock.email?.toLowerCase() !== email) {
          throw new Error(`Seat ${sn} is temporarily held by someone else`)
        }
      }

      for (let i = 0; i < seatNumbers.length; i++) {
        t.set(lockRefs[i]!, { email, expiresAt })
      }
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Could not lock seats' },
      { status: 400 }
    )
  }
}
