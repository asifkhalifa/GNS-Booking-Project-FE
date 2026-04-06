import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { sendPaymentReceivedEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

/** Called from the client after UPI payment so we can email the guest a receipt. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; bookingId?: number }
    const email = String(body.email || '').trim().toLowerCase()
    const bookingId = Number(body.bookingId)
    if (!email || !Number.isFinite(bookingId)) {
      return NextResponse.json({ message: 'email and bookingId required' }, { status: 400 })
    }
    const db = getDb()
    const snap = await db.collection('bookings').where('bookingId', '==', bookingId).limit(1).get()
    if (snap.empty) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
    }
    const doc = snap.docs[0]!
    const d = doc.data() as { email?: string; seats?: string[]; totalAmount?: number }
    if (d.email?.toLowerCase() !== email) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    await sendPaymentReceivedEmail(email, {
      bookingId,
      seats: d.seats ?? [],
      totalAmount: Number(d.totalAmount) || 0,
    })
    await doc.ref.update({ paymentNotifiedAt: Date.now() })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed' },
      { status: 500 }
    )
  }
}
