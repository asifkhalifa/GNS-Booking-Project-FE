import { NextResponse } from 'next/server'
import { replaceAllSeatsFromSeed } from '@/lib/ensureSeats'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/reseed-seats
 * Header: x-seat-reseed-secret: <SEAT_RESEED_SECRET from .env.local>
 *
 * Wipes `seats` and `locks`, then writes the chart from `buildInitialSeats()`.
 * Does not modify `bookings` — use only when you accept or have cleared related data.
 */
/** Discovery / health: does not perform reseed. */
export async function GET() {
  const configured = Boolean(process.env.SEAT_RESEED_SECRET?.trim())
  return NextResponse.json({
    configured,
    hint: 'POST with header x-seat-reseed-secret, or run npm run seed:seats while dev server is up.',
  })
}

export async function POST(req: Request) {
  const secret = process.env.SEAT_RESEED_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { message: 'SEAT_RESEED_SECRET is not set on the server.' },
      { status: 503 }
    )
  }
  const header = req.headers.get('x-seat-reseed-secret')?.trim()
  if (header !== secret) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { seatCount } = await replaceAllSeatsFromSeed()
    return NextResponse.json({ ok: true, seatCount })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Reseed failed' },
      { status: 500 }
    )
  }
}
