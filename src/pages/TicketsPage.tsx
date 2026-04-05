import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { fetchUserTickets, type UserTicket } from '../modules/booking'
import { fetchAllSeats } from '../modules/seat'
import { useUser } from '../modules/user'
import { EventTicket, ticketIsPaid } from './EventTicket'

export function TicketsPage() {
  const navigate = useNavigate()
  const { session } = useUser()
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.email) {
      navigate('/', { replace: true })
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchUserTickets(session.email)
      .then(async (raw) => {
        let next: UserTicket[] = raw
        try {
          const seats = await fetchAllSeats()
          const priceBySeat = new Map(seats.map((s) => [s.seatNumber, s.price]))
          next = raw.map((t) => {
            const chart = priceBySeat.get(t.seatNumber)
            const hasChartPrice = chart != null && Number.isFinite(chart) && chart > 0
            return { ...t, price: hasChartPrice ? chart : t.price }
          })
        } catch {
          /* keep booking-derived prices if seat map fails */
        }
        if (!cancelled) setTickets(next)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load tickets.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session?.email, navigate])

  const sorted = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const da = ticketIsPaid(a) ? 0 : 1
      const db = ticketIsPaid(b) ? 0 : 1
      if (da !== db) return da - db
      return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true, sensitivity: 'base' })
    })
  }, [tickets])

  if (!session?.email) return null
  if (session.isAdmin) {
    return <Navigate to="/admin/tickets" replace />
  }

  return (
    <main className="tickets-page">
      <div className="tickets-page__header">
        <Link to="/" className="tickets-page__back">
          ← Back
        </Link>
        <h1 className="tickets-page__title">Your tickets</h1>
        <p className="tickets-page__hint">
          Approved (<strong>PAID</strong>) tickets are sharp with full seat details. Bookings with{' '}
          <strong>PAYMENT_PENDING</strong> stay blurred until approved.
        </p>
      </div>
      {loading && <p className="tickets-page__status">Loading your tickets…</p>}
      {error && (
        <div className="tickets-page__error" role="alert">
          <p>{error}</p>
          <p className="tickets-page__error-hint">
            Your API should expose <code>GET /booking/tickets/all/get?email=…</code> returning a JSON array (see{' '}
            <code>parseTicketsPayload</code> in the booking client).
          </p>
        </div>
      )}
      {!loading && !error && sorted.length === 0 && (
        <p className="tickets-page__empty">No tickets found for this account yet.</p>
      )}
      <div className="tickets-page__grid">
        {sorted.map((t, i) => (
          <EventTicket key={`${t.seatNumber}-${i}`} ticket={t} />
        ))}
      </div>
    </main>
  )
}
