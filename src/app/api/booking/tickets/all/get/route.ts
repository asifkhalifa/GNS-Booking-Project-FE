import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

function flattenBookingsForUser(email: string) {
  const em = email.trim().toLowerCase()
  return async () => {
    const db = getDb()
    const snap = await db.collection('bookings').where('email', '==', em).get()
    const rows: Record<string, unknown>[] = []
    snap.forEach((doc) => {
      const d = doc.data() as {
        bookingId?: number
        seats?: string[]
        totalAmount?: number
        status?: string
        email?: string
      }
      rows.push({
        bookingId: d.bookingId,
        seats: d.seats ?? [],
        totalAmount: d.totalAmount ?? 0,
        status: d.status ?? 'PAYMENT_PENDING',
        email: d.email ?? em,
      })
    })
    return rows
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = String(searchParams.get('email') || '').trim()
    if (!email) {
      return NextResponse.json({ message: 'email required' }, { status: 400 })
    }
    const rows = await flattenBookingsForUser(email)()
    return NextResponse.json(rows)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed' },
      { status: 500 }
    )
  }
}
