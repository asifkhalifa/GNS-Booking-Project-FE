import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { emailDocKey } from '@/lib/emailKey'
import { isAdminEmail } from '@/lib/serverAuth'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; otp?: string }
    const email = String(body.email || '').trim()
    const otp = String(body.otp || '').trim()
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP required' }, { status: 400 })
    }
    const db = getDb()
    const key = emailDocKey(email)
    const ref = db.collection('otps').doc(key)
    const doc = await ref.get()
    const data = doc.data() as { code?: string; expires?: number } | undefined
    if (!doc.exists || !data) {
      return NextResponse.json({ message: 'OTP expired or not found' }, { status: 400 })
    }
    if (data.expires != null && Date.now() > data.expires) {
      await ref.delete()
      return NextResponse.json({ message: 'OTP expired' }, { status: 400 })
    }
    if (data.code !== otp) {
      return NextResponse.json({ message: 'Invalid OTP' }, { status: 400 })
    }
    await ref.delete()
    const isAdmin = isAdminEmail(email)
    await db
      .collection('users')
      .doc(key)
      .set(
        {
          email: email.toLowerCase(),
          isAdmin,
          updatedAt: Date.now(),
        },
        { merge: true }
      )
    return NextResponse.json({ isAdmin, email: email.toLowerCase(), profile: { isAdmin } })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
