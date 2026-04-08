/**
 * When true, `/admin/tickets` loads {@link STATIC_ADMIN_BOOKINGS} and Save is local-only.
 *
 * - **Default:** live API (`fetchAdminBookings`).
 * - **Static:** set `VITE_ADMIN_BOOKINGS_STATIC=true` or open `/admin/tickets?static=1`.
 */
export function useStaticAdminBookingsList(searchStaticParam: string | null): boolean {
  if (import.meta.env.VITE_ADMIN_BOOKINGS_STATIC === 'true') {
    return true
  }
  return searchStaticParam === '1'
}
