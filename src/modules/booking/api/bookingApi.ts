import { API_BASE_URL } from '../../../apiBase'
import type {
  AdminBooking,
  AdminBookingPaymentMethod,
  CancelAdminSeatsPayload,
  SaveBookingRequest,
  UpdateAdminBookingPayload,
  UserTicket,
} from '../types'

const base = API_BASE_URL

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data === 'object' && data && 'message' in data) {
      return String((data as { message: unknown }).message)
    }
    return res.statusText || 'Request failed'
  } catch {
    return res.statusText || 'Request failed'
  }
}

export async function saveBooking(payload: SaveBookingRequest): Promise<unknown> {
  const body = {
    email: payload.email.trim(),
    seatNmbrs: payload.seatNmbrs.map((s) => String(s).trim()),
  }
  const res = await fetch(`${base}/booking/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function normStatus(v: unknown): string {
  return String(v ?? 'UNPAID')
    .trim()
    .toUpperCase()
}

/** Flatten booking rows (e.g. `{ seats, totalAmount, status }`) or per-seat rows into UserTicket[]. */
export function parseTicketsPayload(data: unknown): UserTicket[] {
  if (!Array.isArray(data)) return []
  const out: UserTicket[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const status = normStatus(o.status ?? o.paymentStatus ?? o.payment_status)
    const priceRaw = o.price ?? o.seatPrice ?? o.seat_price
    const safePrice = priceRaw != null && priceRaw !== '' && Number.isFinite(Number(priceRaw)) ? Number(priceRaw) : undefined

    const totalRaw = o.totalAmount ?? o.total_amount
    const totalAmount =
      totalRaw != null && totalRaw !== '' && Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : undefined

    const bookingId =
      typeof o.bookingId === 'number'
        ? o.bookingId
        : typeof o.booking_id === 'number'
          ? o.booking_id
          : undefined

    const ownerRaw = o.email ?? o.userEmail ?? o.user_email
    const ownerEmail =
      typeof ownerRaw === 'string' && ownerRaw.trim() ? ownerRaw.trim() : undefined

    const seatList = o.seats ?? o.seatNmbrs ?? o.seatNumbers ?? o.seat_numbers
    if (Array.isArray(seatList) && seatList.length > 0) {
      let perSeat = safePrice
      if (perSeat == null && totalAmount != null) {
        perSeat = Math.round(totalAmount / seatList.length)
      }
      for (const s of seatList) {
        const sn = String(s).trim()
        if (!sn) continue
        out.push({ seatNumber: sn, status, price: perSeat, bookingId, ownerEmail })
      }
      continue
    }
    const one = o.seatNumber ?? o.seat_number ?? o.seatNmbr
    if (one != null && String(one).trim()) {
      out.push({
        seatNumber: String(one).trim(),
        status,
        price: safePrice ?? totalAmount,
        bookingId,
        ownerEmail,
      })
    }
  }
  return out
}

/**
 * GET /booking/tickets/all/get?email=...
 * Backend should return a JSON array of bookings or per-seat objects (see parseTicketsPayload).
 */
export async function fetchUserTickets(email: string): Promise<UserTicket[]> {
  const q = encodeURIComponent(email.trim())
  const res = await fetch(`${base}/booking/tickets/all/get?email=${q}`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(await parseError(res))
  const data: unknown = await res.json()
  return parseTicketsPayload(data)
}

/**
 * Admin: flattened tickets (legacy). Same host as {@link fetchAdminBookings}.
 * GET /booking/tickets/admin/all/get?email=...
 */
export async function fetchAdminAllTickets(email: string): Promise<UserTicket[]> {
  const q = encodeURIComponent(email.trim())
  const res = await fetch(`${base}/booking/tickets/admin/all/get?email=${q}`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(await parseError(res))
  const data: unknown = await res.json()
  return parseTicketsPayload(data)
}

function parsePaymentMethodField(v: unknown): AdminBookingPaymentMethod | '' {
  const s = String(v ?? '')
    .trim()
    .toUpperCase()
  if (s === 'ONLINE') return 'ONLINE'
  if (s === 'CASH') return 'CASH'
  return ''
}

/** Booking-level rows for admin accordion (no flattening). */
export function parseAdminBookingsList(data: unknown): AdminBooking[] {
  if (!Array.isArray(data)) return []
  const out: AdminBooking[] = []
  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, unknown>
    const bid = o.bookingId ?? o.booking_id
    const bookingId = typeof bid === 'number' ? bid : Number(bid)
    if (!Number.isFinite(bookingId)) continue

    const emailRaw = o.email ?? o.userEmail ?? o.user_email
    const email = typeof emailRaw === 'string' ? emailRaw.trim() : ''

    const totalRaw = o.totalAmount ?? o.total_amount
    const totalAmount = totalRaw != null && totalRaw !== '' && Number.isFinite(Number(totalRaw)) ? Number(totalRaw) : 0

    const status = normStatus(o.status ?? o.paymentStatus ?? o.payment_status)

    const seatList = o.seats ?? o.seatNmbrs ?? o.seatNumbers ?? o.seat_numbers
    const seats = Array.isArray(seatList)
      ? seatList.map((s) => String(s).trim()).filter((s) => s.length > 0)
      : []

    const pm = parsePaymentMethodField(o.paymentMethod ?? o.payment_method ?? o.paymentMode ?? o.payment_mode)

    const approvedRaw = o.isApproved ?? o.is_approved ?? o.approved
    const explicitApproved =
      approvedRaw === true ||
      approvedRaw === 1 ||
      String(approvedRaw).toLowerCase() === 'true'
    const isApproved = explicitApproved || status === 'PAID'

    out.push({
      bookingId,
      email,
      totalAmount,
      status,
      seats,
      paymentMethod: pm,
      isApproved,
    })
  }
  return out
}

/**
 * GET /booking/tickets/admin/all/get?email=...
 * `email` is the signed-in admin’s email (request param used by the server).
 */
export async function fetchAdminBookings(email: string): Promise<AdminBooking[]> {
  const q = encodeURIComponent(email.trim())
  const res = await fetch(`${base}/booking/tickets/admin/all/get?email=${q}`)
  if (res.status === 404) return []
  if (!res.ok) throw new Error(await parseError(res))
  const data: unknown = await res.json()
  return parseAdminBookingsList(data)
}

/**
 * POST /booking/confirm
 * Body: { bkngId, pymntMthd, email, aprvd } — `email` must be the logged-in user’s email (see `loginUserEmail` in payload).
 */
export async function updateAdminBooking(payload: UpdateAdminBookingPayload): Promise<unknown> {
  const pymntMthd = (payload.paymentMethod ?? 'ONLINE') as string
  const body = {
    bkngId: payload.bookingId,
    pymntMthd,
    email: payload.loginUserEmail.trim(),
    aprvd: payload.isApproved ?? false,
  }
  const res = await fetch(`${base}/booking/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

/**
 * POST /booking/cancel-seats
 * Body: { email, bkngId, seatNmbrs } — `email` is the logged-in user performing the action.
 * Response body is plain text from the server.
 */
export async function cancelAdminBookingSeats(payload: CancelAdminSeatsPayload): Promise<string> {
  const body = {
    email: payload.loginUserEmail.trim(),
    bkngId: payload.bookingId,
    seatNmbrs: payload.seatNmbrs.map((s) => String(s).trim()),
  }
  const res = await fetch(`${base}/booking/cancel-seats`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const text = await res.text()
  return text.trim() || 'Seats cancelled.'
}
