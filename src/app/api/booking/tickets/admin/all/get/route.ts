import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

/** Admin list: all bookings (same shape as previous Java API). */
export async function GET() {
  try {
    const db = getDb()
    const snap = await db.collection('bookings').get()
    const rows: Record<string, unknown>[] = []
    snap.forEach((doc) => {
      const d = doc.data() as {
        bookingId?: number
        email?: string
        seats?: string[]
        totalAmount?: number
        status?: string
        paymentMethod?: string
        isApproved?: boolean
      }
      rows.push({
        bookingId: d.bookingId,
        email: d.email ?? '',
        seats: d.seats ?? [],
        totalAmount: d.totalAmount ?? 0,
        status: d.status ?? 'PAYMENT_PENDING',
        paymentMethod: d.paymentMethod ?? '',
        isApproved: Boolean(d.isApproved),
      })
    })
    rows.sort((a, b) => Number(b.bookingId) - Number(a.bookingId))
    return NextResponse.json(rows)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed' },
      { status: 500 }
    )
  }
}
