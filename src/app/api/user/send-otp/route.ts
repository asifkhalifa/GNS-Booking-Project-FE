import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { sendOtpEmail } from '@/lib/email'
import { emailDocKey } from '@/lib/emailKey'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string }
    const email = String(body.email || '').trim()
    if (!email) {
      return NextResponse.json({ message: 'Email required' }, { status: 400 })
    }
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expires = Date.now() + 10 * 60 * 1000
    const db = getDb()
    await db
      .collection('otps')
      .doc(emailDocKey(email))
      .set({ code, email: email.toLowerCase(), expires })
    await sendOtpEmail(email, code)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Could not send OTP' },
      { status: 500 }
    )
  }
}
