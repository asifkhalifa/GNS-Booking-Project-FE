'use client'

import { useEffect, useState } from 'react'
import type { AdminBooking, AdminBookingPaymentMethod, UserTicket } from '../../booking'
import { ticketIsPaid } from '@/views/EventTicket'

export type AdminBookingDraft = {
  paymentMethod: AdminBookingPaymentMethod | ''
  isApproved: boolean
}

type Props = {
  booking: AdminBooking
  draft: AdminBookingDraft
  onDraftChange: (next: AdminBookingDraft) => void
  seatTickets: UserTicket[]
  onSave: () => void
  saving: boolean
  saveError: string | null
  /** Opens the parent “are you sure?” flow; does not call the API directly. */
  onCancelSeats: (seatNmbrs: string[]) => void
  canceling: boolean
}

function statusClass(status: string): string {
  return status.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}

export function AdminBookingAccordion({
  booking,
  draft,
  onDraftChange,
  seatTickets,
  onSave,
  saving,
  saveError,
  onCancelSeats,
  canceling,
}: Props) {
  const selectValue = draft.paymentMethod || 'ONLINE'
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const seatsKey = booking.seats.join(',')

  useEffect(() => {
    setSelected(new Set())
  }, [seatsKey])

  const busy = saving || canceling

  function toggleSeat(seatNumber: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(seatNumber)) next.delete(seatNumber)
      else next.add(seatNumber)
      return next
    })
  }

  function handleCancelSelected() {
    const list = [...selected]
    if (list.length === 0) return
    onCancelSeats(list)
  }

  return (
    <details className="admin-booking-acc">
      <summary className="admin-booking-acc__summary">
        <span className="admin-booking-acc__id">#{booking.bookingId}</span>
        <span className="admin-booking-acc__email" title={booking.email}>
          {booking.email || '—'}
        </span>
        <span className="admin-booking-acc__amount">₹{booking.totalAmount}</span>
        <span
          className={`admin-booking-acc__status admin-booking-acc__status--${statusClass(booking.status)}`}
        >
          {booking.status}
        </span>
      </summary>
      <div className="admin-booking-acc__body">
        <div className="admin-booking-acc__controls">
          <label className="admin-booking-acc__field">
            <span className="admin-booking-acc__label">Payment method</span>
            <select
              className="admin-booking-acc__select"
              value={selectValue}
              onChange={(e) =>
                onDraftChange({
                  ...draft,
                  paymentMethod: e.target.value as AdminBookingPaymentMethod,
                })
              }
              disabled={busy}
            >
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
            </select>
          </label>
          <label className="admin-booking-acc__approve">
            <input
              type="checkbox"
              checked={draft.isApproved}
              onChange={(e) => onDraftChange({ ...draft, isApproved: e.target.checked })}
              disabled={busy}
            />
            <span>Payment approved (sets status to PAID)</span>
          </label>
          <button type="button" className="btn btn--primary admin-booking-acc__save" onClick={onSave} disabled={busy}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
        {saveError && (
          <p className="admin-booking-acc__error" role="alert">
            {saveError}
          </p>
        )}

        <p className="admin-booking-acc__seats-label">Seats — select to cancel</p>
        <ul className="admin-booking-acc__seat-list">
          {seatTickets.map((t) => (
            <li key={t.seatNumber} className="admin-seat-row">
              <label className="admin-seat-row__label">
                <input
                  type="checkbox"
                  className="admin-seat-row__check"
                  checked={selected.has(t.seatNumber)}
                  onChange={() => toggleSeat(t.seatNumber)}
                  disabled={busy}
                />
                <span className="admin-seat-row__seat">{t.seatNumber}</span>
                <span className="admin-seat-row__price">
                  {t.price != null && Number.isFinite(t.price) ? `₹${t.price}` : '—'}
                </span>
                <span
                  className={`admin-seat-row__pill admin-seat-row__pill--${ticketIsPaid(t) ? 'paid' : 'pending'}`}
                >
                  {ticketIsPaid(t) ? 'PAID' : t.status}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="admin-booking-acc__cancel-row">
          <button
            type="button"
            className="btn btn--ghost admin-booking-acc__cancel-btn"
            onClick={handleCancelSelected}
            disabled={busy || selected.size === 0}
          >
            {canceling ? 'Cancelling…' : `Cancel selected (${selected.size})`}
          </button>
        </div>
      </div>
    </details>
  )
}
