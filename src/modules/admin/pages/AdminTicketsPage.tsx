import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { STATIC_ADMIN_BOOKINGS } from '../../../data/staticAdminBookings'
import {
  cancelAdminBookingSeats,
  fetchAdminBookings,
  updateAdminBooking,
  type AdminBooking,
  type AdminBookingPaymentMethod,
  type UserTicket,
} from '../../booking'
import { fetchAllSeats } from '../../seat'
import { useUser } from '../../user'
import { AdminBookingAccordion, type AdminBookingDraft } from '../components/AdminBookingAccordion'
import { useStaticAdminBookingsList } from '../lib/adminTicketsStatic'

function buildSeatTickets(b: AdminBooking, priceBySeat: Map<string, number>): UserTicket[] {
  const perSeat =
    b.seats.length > 0 && b.totalAmount > 0 ? Math.round(b.totalAmount / b.seats.length) : undefined
  return b.seats.map((seatNumber) => {
    const chart = priceBySeat.get(seatNumber)
    const hasChart = chart != null && Number.isFinite(chart) && chart > 0
    return {
      seatNumber,
      status: b.status,
      price: hasChart ? chart : perSeat,
      bookingId: b.bookingId,
      ownerEmail: b.email || undefined,
    }
  })
}

/** After removing seats, recompute total; returns null if no seats left (drop booking). */
function applySeatCancellation(
  booking: AdminBooking,
  seatNmbrs: string[],
  priceBySeat: Map<string, number>
): AdminBooking | null {
  const remove = new Set(seatNmbrs.map((s) => s.trim()))
  const remaining = booking.seats.filter((s) => !remove.has(s))
  if (remaining.length === 0) return null
  const origCount = booking.seats.length
  const fallbackPer = origCount > 0 ? booking.totalAmount / origCount : 0
  let total = 0
  for (const s of remaining) {
    const p = priceBySeat.get(s)
    total += p != null && p > 0 ? p : Math.round(fallbackPer)
  }
  return { ...booking, seats: remaining, totalAmount: total }
}

export function AdminTicketsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const staticBookings = useStaticAdminBookingsList(searchParams.get('static'))
  const { session } = useUser()
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [priceBySeat, setPriceBySeat] = useState<Map<string, number>>(() => new Map())
  const [edits, setEdits] = useState<Record<number, AdminBookingDraft>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [saveErrors, setSaveErrors] = useState<Record<number, string>>({})
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState<null | { booking: AdminBooking; seatNmbrs: string[] }>(
    null
  )
  const [cancelFeedback, setCancelFeedback] = useState<null | { message: string; isError: boolean }>(null)
  const cancelFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const closeCancelFeedback = useCallback(() => {
    if (cancelFeedbackTimerRef.current != null) {
      clearTimeout(cancelFeedbackTimerRef.current)
      cancelFeedbackTimerRef.current = null
    }
    setCancelFeedback(null)
  }, [])

  function showCancelFeedback(message: string, isError: boolean) {
    if (cancelFeedbackTimerRef.current != null) {
      clearTimeout(cancelFeedbackTimerRef.current)
      cancelFeedbackTimerRef.current = null
    }
    setCancelFeedback({ message, isError })
    if (!isError) {
      cancelFeedbackTimerRef.current = setTimeout(() => {
        setCancelFeedback(null)
        cancelFeedbackTimerRef.current = null
      }, 7000)
    }
  }

  useEffect(
    () => () => {
      if (cancelFeedbackTimerRef.current != null) {
        clearTimeout(cancelFeedbackTimerRef.current)
      }
    },
    []
  )

  const applyBookings = useCallback((raw: AdminBooking[]) => {
    setBookings(raw)
    const next: Record<number, AdminBookingDraft> = {}
    for (const b of raw) {
      next[b.bookingId] = {
        paymentMethod: (b.paymentMethod || 'ONLINE') as AdminBookingPaymentMethod | '',
        isApproved: b.isApproved,
      }
    }
    setEdits(next)
  }, [])

  const loadData = useCallback(async () => {
    let map = new Map<string, number>()
    try {
      const seats = await fetchAllSeats()
      map = new Map(seats.map((s) => [s.seatNumber, s.price]))
    } catch {
      /* seat chart optional for prices */
    }
    setPriceBySeat(map)

    if (staticBookings) {
      applyBookings(STATIC_ADMIN_BOOKINGS.map((b) => ({ ...b })))
      return
    }

    if (!session?.email) {
      applyBookings([])
      return
    }
    const raw = await fetchAdminBookings(session.email)
    applyBookings(raw)
  }, [staticBookings, applyBookings, session?.email])

  useEffect(() => {
    if (!session?.email) {
      navigate('/', { replace: true })
      return
    }
    if (!session.isAdmin) {
      navigate('/', { replace: true })
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    loadData()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load bookings.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session?.email, session?.isAdmin, navigate, loadData, staticBookings])

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => b.bookingId - a.bookingId)
  }, [bookings])

  async function handleSaveBooking(b: AdminBooking) {
    const draft =
      edits[b.bookingId] ?? {
        paymentMethod: (b.paymentMethod || 'ONLINE') as AdminBookingPaymentMethod | '',
        isApproved: b.isApproved,
      }
    setSavingId(b.bookingId)
    setSaveErrors((prev) => {
      const next = { ...prev }
      delete next[b.bookingId]
      return next
    })
    try {
      if (staticBookings) {
        await new Promise((r) => window.setTimeout(r, 450))
        const pm = draft.paymentMethod === '' ? 'ONLINE' : draft.paymentMethod
        setBookings((prev) =>
          prev.map((row) =>
            row.bookingId === b.bookingId
              ? {
                  ...row,
                  paymentMethod: pm,
                  isApproved: draft.isApproved,
                  status: draft.isApproved ? 'PAID' : 'PAYMENT_PENDING',
                }
              : row
          )
        )
        setEdits((prev) => ({
          ...prev,
          [b.bookingId]: { paymentMethod: pm, isApproved: draft.isApproved },
        }))
        return
      }
      const loginUserEmail = session?.email?.trim() ?? ''
      if (!loginUserEmail) {
        throw new Error('You must be signed in as admin to confirm.')
      }
      await updateAdminBooking({
        bookingId: b.bookingId,
        loginUserEmail,
        paymentMethod: draft.paymentMethod === '' ? 'ONLINE' : draft.paymentMethod,
        isApproved: draft.isApproved,
      })
      await loadData()
    } catch (e) {
      setSaveErrors((prev) => ({
        ...prev,
        [b.bookingId]: e instanceof Error ? e.message : 'Save failed.',
      }))
    } finally {
      setSavingId(null)
    }
  }

  function setDraft(bookingId: number, next: AdminBookingDraft) {
    setEdits((prev) => ({ ...prev, [bookingId]: next }))
  }

  function requestCancelSeats(b: AdminBooking, seatNmbrs: string[]) {
    if (seatNmbrs.length === 0) return
    setCancelConfirm({ booking: b, seatNmbrs })
  }

  async function executeConfirmedCancel() {
    if (!cancelConfirm) return
    const { booking: b, seatNmbrs } = cancelConfirm
    setCancelConfirm(null)
    setCancelingId(b.bookingId)
    try {
      if (staticBookings) {
        await new Promise((r) => window.setTimeout(r, 400))
        setBookings((prev) => {
          const row = prev.find((x) => x.bookingId === b.bookingId)
          if (!row) return prev
          const updated = applySeatCancellation(row, seatNmbrs, priceBySeat)
          if (!updated) return prev.filter((x) => x.bookingId !== b.bookingId)
          return prev.map((x) => (x.bookingId === b.bookingId ? updated : x))
        })
        showCancelFeedback('Seats updated (static demo).', false)
        return
      }
      const loginUserEmail = session?.email?.trim() ?? ''
      if (!loginUserEmail) {
        showCancelFeedback('You must be signed in to cancel seats.', true)
        return
      }
      const message = await cancelAdminBookingSeats({
        bookingId: b.bookingId,
        loginUserEmail,
        seatNmbrs,
      })
      await loadData()
      showCancelFeedback(message, false)
    } catch (e) {
      showCancelFeedback(e instanceof Error ? e.message : 'Cancel failed.', true)
    } finally {
      setCancelingId(null)
    }
  }

  useEffect(() => {
    if (!cancelConfirm) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setCancelConfirm(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelConfirm])

  useEffect(() => {
    if (!cancelFeedback) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCancelFeedback()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cancelFeedback, closeCancelFeedback])

  if (!session?.email) return null
  if (!session.isAdmin) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="tickets-page admin-tickets-page">
      <div className="tickets-page__header">
        <Link to="/admin/profile" className="tickets-page__back">
          ← Admin
        </Link>
        <h1 className="tickets-page__title">All bookings</h1>
        <p className="tickets-page__hint">
          Expand a booking to update <strong>payment</strong> or select seats and{' '}
          <strong>cancel selected</strong>. Each seat shows number, amount, and status only.
        </p>
        {staticBookings && (
          <p className="admin-tickets-page__demo-banner" role="status">
            <strong>Static data</strong> — from <code>src/data/staticAdminBookings.ts</code>. Save only
            updates this page.{' '}
            {import.meta.env.DEV ? (
              <span>
                For the API: unset <code>VITE_ADMIN_BOOKINGS_STATIC</code> and open this page without{' '}
                <code>?static=1</code>.
              </span>
            ) : searchParams.get('static') === '1' ? (
              <Link to="/admin/tickets">Use live API</Link>
            ) : (
              <span>
                Unset <code>VITE_ADMIN_BOOKINGS_STATIC</code> in your deployment environment to use the API.
              </span>
            )}
          </p>
        )}
      </div>
      {loading && <p className="tickets-page__status">Loading bookings…</p>}
      {error && (
        <div className="tickets-page__error" role="alert">
          <p>{error}</p>
          <p className="tickets-page__error-hint">
            <code>GET /booking/tickets/admin/all/get?email=…</code> should return{' '}
            <code>bookingId</code>, <code>email</code>, <code>totalAmount</code>, <code>status</code>,{' '}
            <code>seats</code>[], optional <code>paymentMethod</code> (ONLINE | CASH),{' '}
            <code>isApproved</code>. Confirm / save: <code>POST /booking/confirm</code> with{' '}
            <code>bkngId</code>, <code>pymntMthd</code>, admin <code>email</code>, <code>aprvd</code>. Seat cancel:{' '}
            <code>POST /booking/cancel-seats</code> with login <code>email</code>, <code>bkngId</code>,{' '}
            <code>seatNmbrs</code>.
          </p>
        </div>
      )}
      {!loading && !error && sortedBookings.length === 0 && (
        <p className="tickets-page__empty">No bookings returned yet.</p>
      )}
      {!loading && !error && sortedBookings.length > 0 && (
        <div className="admin-tickets-page__list">
          {sortedBookings.map((b) => {
            const draft =
              edits[b.bookingId] ?? {
                paymentMethod: (b.paymentMethod || 'ONLINE') as AdminBookingPaymentMethod | '',
                isApproved: b.isApproved,
              }
            return (
              <AdminBookingAccordion
                key={b.bookingId}
                booking={b}
                draft={draft}
                onDraftChange={(d) => setDraft(b.bookingId, d)}
                seatTickets={buildSeatTickets(b, priceBySeat)}
                onSave={() => void handleSaveBooking(b)}
                saving={savingId === b.bookingId}
                saveError={saveErrors[b.bookingId] ?? null}
                onCancelSeats={(seats) => requestCancelSeats(b, seats)}
                canceling={cancelingId === b.bookingId}
              />
            )
          })}
        </div>
      )}

      {cancelConfirm && (
        <div
          className="confirm-seats-backdrop"
          role="presentation"
          onClick={() => setCancelConfirm(null)}
        >
          <div
            className="confirm-seats-dialog admin-cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-cancel-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="admin-cancel-confirm-title" className="confirm-seats-dialog__title">
              Cancel seats?
            </h2>
            <p className="confirm-seats-dialog__body">
              Are you sure you want to cancel <strong>{cancelConfirm.seatNmbrs.length}</strong> seat
              {cancelConfirm.seatNmbrs.length === 1 ? '' : 's'} for booking{' '}
              <strong>#{cancelConfirm.booking.bookingId}</strong>?
            </p>
            <p className="admin-cancel-dialog__seat-list" aria-label="Seats to cancel">
              {cancelConfirm.seatNmbrs.join(', ')}
            </p>
            <div className="confirm-seats-dialog__actions">
              <button
                type="button"
                className="confirm-seats-dialog__btn confirm-seats-dialog__btn--secondary"
                onClick={() => setCancelConfirm(null)}
              >
                No, go back
              </button>
              <button
                type="button"
                className="confirm-seats-dialog__btn confirm-seats-dialog__btn--primary"
                onClick={() => void executeConfirmedCancel()}
                disabled={cancelingId != null}
              >
                Yes, cancel seats
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelFeedback && (
        <div className="confirm-seats-backdrop" role="presentation" onClick={closeCancelFeedback}>
          <div
            className="confirm-seats-dialog admin-cancel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-cancel-feedback-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="admin-cancel-feedback-title" className="confirm-seats-dialog__title">
              {cancelFeedback.isError ? 'Could not cancel' : 'Server response'}
            </h2>
            <p
              className={`confirm-seats-dialog__body admin-cancel-dialog__message${cancelFeedback.isError ? ' admin-cancel-dialog__message--error' : ''}`}
            >
              {cancelFeedback.message}
            </p>
            {!cancelFeedback.isError && (
              <p className="admin-cancel-dialog__auto-close-hint">This window closes automatically in 7 seconds.</p>
            )}
            <div className="confirm-seats-dialog__actions">
              <button
                type="button"
                className="confirm-seats-dialog__btn confirm-seats-dialog__btn--primary"
                onClick={closeCancelFeedback}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
