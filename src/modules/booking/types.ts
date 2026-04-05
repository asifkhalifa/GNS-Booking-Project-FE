/** Matches backend contract for POST /booking/save */
export type SaveBookingRequest = {
  email: string
  seatNmbrs: string[]
}

/** One row per seat from GET /booking/tickets/all/get?email= (normalized on the client). */
export type UserTicket = {
  seatNumber: string
  status: string
  /** Seat price from chart when available; else booking total ÷ seat count from API. */
  price?: number
  bookingId?: number
  /** Set when listing all users’ tickets (admin). */
  ownerEmail?: string
}

export type AdminBookingPaymentMethod = 'ONLINE' | 'CASH'

/** One row from GET /booking/tickets/admin/all/get?email=… (booking-level, not flattened). */
export type AdminBooking = {
  bookingId: number
  email: string
  totalAmount: number
  status: string
  seats: string[]
  paymentMethod: AdminBookingPaymentMethod | ''
  isApproved: boolean
}

/** POST /booking/confirm — admin approves / updates payment on a booking. */
export type UpdateAdminBookingPayload = {
  bookingId: number
  /** Same as logged-in user (`session.email` from login). Sent as JSON field `email`. */
  loginUserEmail: string
  paymentMethod?: AdminBookingPaymentMethod
  isApproved?: boolean
}

/** POST /booking/cancel-seats */
export type CancelAdminSeatsPayload = {
  bookingId: number
  /** Logged-in user email (`session.email`). Sent as JSON `email`. */
  loginUserEmail: string
  seatNmbrs: string[]
}
