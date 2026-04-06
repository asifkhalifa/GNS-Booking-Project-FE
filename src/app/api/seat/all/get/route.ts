import { NextResponse } from 'next/server'
import { listSeatsMerged } from '@/lib/seatMerge'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const forEmail = searchParams.get('email')?.trim() || ''
    const seats = await listSeatsMerged(forEmail || null)
    return NextResponse.json(seats)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Failed to load seats' },
      { status: 500 }
    )
  }
}
