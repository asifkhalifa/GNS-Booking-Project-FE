import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; seatNumbers?: string[] }
    const email = String(body.email || '').trim().toLowerCase()
    const seatNumbers = Array.isArray(body.seatNumbers)
      ? body.seatNumbers.map((s) => String(s).trim()).filter(Boolean)
      : []
    if (!email || seatNumbers.length === 0) {
      return NextResponse.json({ message: 'email and seatNumbers required' }, { status: 400 })
    }
    const db = getDb()
    const batch = db.batch()
    for (const sn of seatNumbers) {
      const ref = db.collection('locks').doc(sn)
      const snap = await ref.get()
      const lock = snap.data() as { email?: string } | undefined
      if (snap.exists && lock?.email?.toLowerCase() === email) {
        batch.delete(ref)
      }
    }
    await batch.commit()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Could not unlock seats' },
      { status: 500 }
    )
  }
}
