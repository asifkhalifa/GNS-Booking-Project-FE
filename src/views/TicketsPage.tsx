'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchUserTickets, type UserTicket } from '../modules/booking'
import { fetchAllSeats } from '../modules/seat'
import { useUser } from '../modules/user'
import { Redirect } from '@/components/Redirect'
import { EventTicket, ticketIsPaid } from './EventTicket'

export function TicketsPage() {
  const router = useRouter()
  const { session } = useUser()
  const [tickets, setTickets] = useState<UserTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!session?.email) {
      router.replace('/')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      fetchUserTickets(session.email),
      fetchAllSeats(session.email).catch(() => []),
    ])
      .then(([raw, seats]) => {
        let next: UserTicket[] = raw
        try {
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
  }, [session?.email, router])

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
    return <Redirect to="/admin/tickets" />
  }

  return (
    <main className="tickets-page">
      <div className="tickets-page__header">
        <Link href="/" className="tickets-page__back">
          ← Back
        </Link>
        <h1 className="tickets-page__title">Your tickets</h1>
        <p className="tickets-page__hint">
          <strong>PAID</strong> tickets unlock full details. Until an admin approves your booking, tickets show{' '}
          <strong>Waiting for approval</strong>.
        </p>
      </div>
      {loading && <p className="tickets-page__status">Loading your tickets…</p>}
      {error && (
        <div className="tickets-page__error" role="alert">
          <p>{error}</p>
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
