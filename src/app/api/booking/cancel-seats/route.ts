import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { ensureSeatsSeeded } from '@/lib/ensureSeats'
import { emailDocKey } from '@/lib/emailKey'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    await ensureSeatsSeeded()
    const body = (await req.json()) as {
      email?: string
      bkngId?: number
      seatNmbrs?: string[]
    }
    const loginEmail = String(body.email || '').trim().toLowerCase()
    const bookingId = Number(body.bkngId)
    const seatNmbrs = Array.isArray(body.seatNmbrs)
      ? body.seatNmbrs.map((s) => String(s).trim()).filter(Boolean)
      : []
    if (!loginEmail || !Number.isFinite(bookingId) || seatNmbrs.length === 0) {
      return NextResponse.json({ message: 'Invalid payload' }, { status: 400 })
    }
    const db = getDb()
    const snap = await db.collection('bookings').where('bookingId', '==', bookingId).limit(1).get()
    if (snap.empty) {
      return new NextResponse('Booking not found', { status: 404 })
    }
    const doc = snap.docs[0]!
    const data = doc.data() as {
      email?: string
      seats?: string[]
    }
    const owner = data.email?.trim().toLowerCase() ?? ''
    const actor = await db.collection('users').doc(emailDocKey(loginEmail)).get()
    const isAdmin = actor.data()?.isAdmin === true
    if (!isAdmin && owner !== loginEmail) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const remove = new Set(seatNmbrs)
    const remaining = (data.seats ?? []).filter((s) => !remove.has(s))

    for (const sn of seatNmbrs) {
      await db.collection('seats').doc(sn).update({ status: 'AVAILABLE' })
    }

    if (remaining.length === 0) {
      await doc.ref.delete()
      return new NextResponse('Booking removed.', { status: 200 })
    }

    let total = 0
    for (const sn of remaining) {
      const s = await db.collection('seats').doc(sn).get()
      total += Number(s.data()?.price) || 0
    }
    await doc.ref.update({ seats: remaining, totalAmount: total, updatedAt: Date.now() })
    return new NextResponse('Seats cancelled.', { status: 200 })
  } catch (e) {
    console.error(e)
    return new NextResponse(e instanceof Error ? e.message : 'Failed', { status: 500 })
  }
}
