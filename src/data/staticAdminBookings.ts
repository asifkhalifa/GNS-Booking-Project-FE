import type { AdminBooking } from '../modules/booking/types'

/**
 * Static admin bookings list for UI dev / offline use.
 * Edit this file to change sample rows. Static mode: `VITE_ADMIN_BOOKINGS_STATIC=true` or `?static=1` on `/admin/tickets`.
 */
export const STATIC_ADMIN_BOOKINGS: AdminBooking[] = [
  {
    bookingId: 2,
    email: 'pending.guest@example.com',
    totalAmount: 1800,
    status: 'PAYMENT_PENDING',
    seats: ['D9', 'F16', 'G16', 'H12', 'I15'],
    paymentMethod: 'ONLINE',
    isApproved: false,
  },
  {
    bookingId: 1,
    email: 'paid.user@example.com',
    totalAmount: 1750,
    status: 'PAID',
    seats: ['F11', 'F12', 'G13', 'H1', 'H11'],
    paymentMethod: 'CASH',
    isApproved: true,
  },
]
