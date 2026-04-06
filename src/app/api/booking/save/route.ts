import { NextResponse } from 'next/server'
import { PAYMENT_CONFIG } from '@/data/paymentConfig'
import { sendBookingCreatedEmail } from '@/lib/email'
import { getDb } from '@/lib/firebase-admin'
import { ensureSeatsSeeded } from '@/lib/ensureSeats'
import { expireStaleBookings } from '@/lib/expireStaleBookings'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    await ensureSeatsSeeded()
    await expireStaleBookings()
    const body = (await req.json()) as { email?: string; seatNmbrs?: string[] }
    const email = String(body.email || '').trim().toLowerCase()
    const seatNmbrs = Array.isArray(body.seatNmbrs)
      ? body.seatNmbrs.map((s) => String(s).trim()).filter(Boolean)
      : []
    if (!email || seatNmbrs.length === 0) {
      return NextResponse.json({ message: 'email and seatNmbrs required' }, { status: 400 })
    }
    const db = getDb()
    const result = await db.runTransaction(async (t) => {
      const counterRef = db.collection('counters').doc('bookings')
      const bookingRef = db.collection('bookings').doc()
      const seatRefs = seatNmbrs.map((sn) => db.collection('seats').doc(sn))
      const lockRefs = seatNmbrs.map((sn) => db.collection('locks').doc(sn))

      const reads = [t.get(counterRef)]
      for (let i = 0; i < seatNmbrs.length; i++) {
        reads.push(t.get(seatRefs[i]!))
        reads.push(t.get(lockRefs[i]!))
      }
      const snaps = await Promise.all(reads)

      const cSnap = snaps[0]!
      const prev = (cSnap.data()?.next as number | undefined) ?? 1000
      const bookingId = prev + 1

      let totalAmount = 0
      const now = Date.now()
      for (let i = 0; i < seatNmbrs.length; i++) {
        const seatSnap = snaps[1 + i * 2]!
        const lockSnap = snaps[1 + i * 2 + 1]!
        const sn = seatNmbrs[i]!
        if (!seatSnap.exists) throw new Error(`Unknown seat ${sn}`)
        const st = seatSnap.data()?.status
        if (st !== 'AVAILABLE') throw new Error(`Seat ${sn} is not available`)
        const lock = lockSnap.data() as { email?: string; expiresAt?: number } | undefined
        if (lock && lock.expiresAt && lock.expiresAt > now && lock.email?.toLowerCase() !== email) {
          throw new Error(`Seat ${sn} is held by another user`)
        }
        totalAmount += Number(seatSnap.data()?.price) || 0
      }

      t.set(counterRef, { next: bookingId }, { merge: true })
      for (let i = 0; i < seatNmbrs.length; i++) {
        t.update(seatRefs[i]!, { status: 'BOOKED' })
        t.delete(lockRefs[i]!)
      }
      const ts = Date.now()
      t.set(bookingRef, {
        bookingId,
        email,
        seats: seatNmbrs,
        totalAmount,
        status: 'PAYMENT_PENDING',
        paymentMethod: '',
        isApproved: false,
        createdAt: ts,
        updatedAt: ts,
      })
      return { bookingId, totalAmount, bookingDocId: bookingRef.id }
    })
    void sendBookingCreatedEmail(email, {
      bookingId: result.bookingId,
      seats: seatNmbrs,
      totalAmount: result.totalAmount,
      upiId: PAYMENT_CONFIG.upiId,
    }).catch((err) => console.error('[email] sendBookingCreatedEmail', err))
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Could not save booking' },
      { status: 400 }
    )
  }
}
