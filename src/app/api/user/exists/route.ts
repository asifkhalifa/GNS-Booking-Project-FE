import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { emailDocKey } from '@/lib/emailKey'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const email = String(searchParams.get('email') || '').trim()
    if (!email) {
      return NextResponse.json({ message: 'email query required' }, { status: 400 })
    }
    const db = getDb()
    const doc = await db.collection('users').doc(emailDocKey(email)).get()
    return NextResponse.json({ exists: doc.exists })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ message: e instanceof Error ? e.message : 'Error' }, { status: 500 })
  }
}
