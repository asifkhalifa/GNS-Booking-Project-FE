import { NextResponse } from 'next/server'
import { sendApprovedTicketEmail } from '@/lib/email'
import { getDb } from '@/lib/firebase-admin'
import { emailDocKey } from '@/lib/emailKey'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      bkngId?: number
      pymntMthd?: string
      email?: string
      aprvd?: boolean
    }
    const bookingId = Number(body.bkngId)
    const pymntMthd = String(body.pymntMthd || 'ONLINE').toUpperCase()
    const loginEmail = String(body.email || '').trim().toLowerCase()
    const aprvd = Boolean(body.aprvd)
    if (!Number.isFinite(bookingId) || !loginEmail) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }
    const db = getDb()
    const actor = await db.collection('users').doc(emailDocKey(loginEmail)).get()
    if (actor.data()?.isAdmin !== true) {
      return NextResponse.json({ message: 'Admin only' }, { status: 403 })
    }
    const snap = await db.collection('bookings').where('bookingId', '==', bookingId).limit(1).get()
    if (snap.empty) {
      return NextResponse.json({ message: 'Booking not found' }, { status: 404 })
    }
    const doc = snap.docs[0]!
    const before = doc.data() as {
      status?: string
      email?: string
      seats?: string[]
      totalAmount?: number
      bookingId?: number
    }
    const prevStatus = before.status
    const status = aprvd || pymntMthd === 'CASH' ? 'PAID' : 'PAYMENT_PENDING'
    await doc.ref.update({
      paymentMethod: pymntMthd,
      isApproved: aprvd,
      status,
      updatedAt: Date.now(),
    })
    if (status === 'PAID' && prevStatus !== 'PAID') {
      const owner = before.email?.trim().toLowerCase()
      const seats = before.seats ?? []
      const totalAmount = Number(before.totalAmount) || 0
      const bid = Number(before.bookingId ?? bookingId)
      if (owner) {
        void sendApprovedTicketEmail(owner, { bookingId: bid, seats, totalAmount }).catch((err) =>
          console.error('[email] sendApprovedTicketEmail', err)
        )
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Update failed' },
      { status: 500 }
    )
  }
}
