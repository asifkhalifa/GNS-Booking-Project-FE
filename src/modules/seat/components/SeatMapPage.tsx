import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { isValidEmail } from '../../../lib/emailUtil'
import { PAYMENT_CONFIG } from '../../../data/paymentConfig'
import { PaymentModal, buildUpiPayUri, saveBooking } from '../../booking'
import { interpretVerifyOtpResponse, sendOtp, useUser, verifyOtp } from '../../user'
import { fetchAllSeats } from '../api/seatApi'
import type { Seat } from '../types'
import { MAX_SEATS_PER_BOOKING } from '../constants'
import {
  ROW_LABELS,
  bucketSeatsForRow,
  groupSeatsByRow,
} from '../lib/seatLayout'
import { ConfirmSeatsDialog } from './ConfirmSeatsDialog'
import { SeatButton } from './SeatButton'

const ADMIN_GUEST_EMAIL_HINT =
  'We always email a code to this address first. After verify, the server creates a user only if they are new; then you complete the booking.'

type PaymentSnapshot = {
  lineItems: { seatNumber: string; price: number }[]
  totalAmount: number
  seatKey: string
}

export function SeatMapPage() {
  const { session } = useUser()
  const isAdmin = session?.isAdmin === true
  const [seats, setSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [limitToast, setLimitToast] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmSubmitting, setConfirmSubmitting] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentSnapshot, setPaymentSnapshot] = useState<PaymentSnapshot | null>(null)
  const [bookingToast, setBookingToast] = useState<string | null>(null)
  const [beneficiaryEmail, setBeneficiaryEmail] = useState('')
  const [adminGuestOtpPhase, setAdminGuestOtpPhase] = useState<'details' | 'guest_otp'>('details')
  const [guestOtp, setGuestOtp] = useState('')

  useEffect(() => {
    if (session?.email) {
      setBeneficiaryEmail((prev) => (prev.trim() === '' ? session.email : prev))
    }
  }, [session?.email])

  const loadSeats = useCallback(async () => {
    const data = await fetchAllSeats(session?.email)
    setSeats(data)
  }, [session?.email])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    loadSeats()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load seats')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [loadSeats])

  const byRow = useMemo(() => groupSeatsByRow(seats), [seats])

  const toggle = useCallback(
    (seat: Seat) => {
      setConfirmDialogOpen(false)
      setConfirmError(null)
      setAdminGuestOtpPhase('details')
      setGuestOtp('')
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(seat.seatNumber)) {
          next.delete(seat.seatNumber)
          return next
        }
        if (next.size >= MAX_SEATS_PER_BOOKING) {
          setLimitToast(`You can select at most ${MAX_SEATS_PER_BOOKING} seats at a time.`)
          window.setTimeout(() => setLimitToast(null), 4000)
          return prev
        }
        next.add(seat.seatNumber)
        return next
      })
    },
    []
  )

  const legendPrices = useMemo(() => {
    const set = new Set<number>()
    for (const s of seats) {
      if (s.price > 0) set.add(s.price)
    }
    return [...set].sort((a, b) => b - a)
  }, [seats])

  const selectedSeats = useMemo(
    () => seats.filter((s) => selected.has(s.seatNumber)),
    [seats, selected]
  )

  const total = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + s.price, 0),
    [selectedSeats]
  )

  const paymentUpiUri = useMemo(() => {
    if (!paymentSnapshot) return ''
    return buildUpiPayUri({
      payeeVpa: PAYMENT_CONFIG.upiId,
      payeeName: PAYMENT_CONFIG.payeeName,
      amountRupee: paymentSnapshot.totalAmount,
      transactionNote: `NAACH26 ${paymentSnapshot.seatKey}`,
    })
  }, [paymentSnapshot])

  const finalizeBookingSave = useCallback(
    async (targetEmail: string) => {
      const seatNums = selectedSeats.map((s) => s.seatNumber)
      await saveBooking({
        email: targetEmail,
        seatNmbrs: seatNums,
      })
      const seatKey = [...selected].sort().join(',')
      setPaymentSnapshot({
        lineItems: selectedSeats.map((s) => ({ seatNumber: s.seatNumber, price: s.price })),
        totalAmount: total,
        seatKey,
      })
      setSelected(new Set())
      setConfirmDialogOpen(false)
      setAdminGuestOtpPhase('details')
      setGuestOtp('')
      await loadSeats()
      setPaymentOpen(true)
      setBookingToast(
        isAdmin
          ? `Booking saved for ${targetEmail}. Guest sees “waiting for approval” until you mark paid.`
          : 'Booking saved. Your tickets show “waiting for approval” until an admin confirms payment.'
      )
      window.setTimeout(() => setBookingToast(null), 5000)
    },
    [selectedSeats, selected, total, isAdmin, loadSeats]
  )

  async function handleInitialConfirmFlow() {
    if (!session?.email || selectedSeats.length === 0) return
    const targetEmail = isAdmin ? beneficiaryEmail.trim() : session.email
    if (!targetEmail) {
      setConfirmError('Enter the guest email for this booking.')
      return
    }
    if (isAdmin && !isValidEmail(targetEmail)) {
      setConfirmError('Enter a valid guest email.')
      return
    }
    setConfirmSubmitting(true)
    setConfirmError(null)
    try {
      if (!isAdmin) {
        await finalizeBookingSave(targetEmail)
        return
      }
      await sendOtp(targetEmail)
      setAdminGuestOtpPhase('guest_otp')
      setGuestOtp('')
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'Could not continue. Try again.')
    } finally {
      setConfirmSubmitting(false)
    }
  }

  async function handleGuestOtpVerifyAndSave() {
    if (!session?.email || selectedSeats.length === 0) return
    const targetEmail = beneficiaryEmail.trim()
    const code = guestOtp.trim()
    if (!isValidEmail(targetEmail)) {
      setConfirmError('Enter a valid guest email.')
      return
    }
    if (!code) {
      setConfirmError('Enter the OTP from the guest’s email.')
      return
    }
    setConfirmSubmitting(true)
    setConfirmError(null)
    try {
      const body = await verifyOtp(targetEmail, code)
      const parsed = interpretVerifyOtpResponse(body)
      if (!parsed.ok) {
        setConfirmError(parsed.message)
        return
      }
      await finalizeBookingSave(targetEmail)
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'Verification or save failed. Try again.')
    } finally {
      setConfirmSubmitting(false)
    }
  }

  function handleConfirmDialogPrimary() {
    if (isAdmin && adminGuestOtpPhase === 'guest_otp') {
      void handleGuestOtpVerifyAndSave()
      return
    }
    void handleInitialConfirmFlow()
  }

  function handleGuestOtpBack() {
    if (confirmSubmitting) return
    setAdminGuestOtpPhase('details')
    setGuestOtp('')
    setConfirmError(null)
  }

  function openConfirmDialog() {
    setConfirmError(null)
    setAdminGuestOtpPhase('details')
    setGuestOtp('')
    setConfirmDialogOpen(true)
  }

  function closeConfirmDialog() {
    if (confirmSubmitting) return
    setConfirmDialogOpen(false)
    setConfirmError(null)
    setAdminGuestOtpPhase('details')
    setGuestOtp('')
  }

  function closePayment() {
    setPaymentOpen(false)
    setPaymentSnapshot(null)
  }

  return (
    <main className="seat-map-page">
      <div className="seat-map-page__intro">
        <h1 className="seat-map-page__title">Choose your seats</h1>
        <p className="seat-map-page__sub">
          Tap available seats to select (max {MAX_SEATS_PER_BOOKING} seats). Booked seats cannot be
          chosen. After you <strong>confirm seats</strong>, your booking is saved on the server—then pay
          with UPI.
          {isAdmin && (
            <>
              {' '}
              As an <strong>admin</strong>, enter the guest email, then we always send an OTP to that
              address. After they verify, the server updates or creates their user as needed, then you
              save the booking.
            </>
          )}
          {!session && (
            <>
              {' '}
              <Link to="/" className="seat-map-page__inline-link">
                Sign in from home
              </Link>{' '}
              to confirm and pay.
            </>
          )}
        </p>
      </div>

      {bookingToast && (
        <p className="seat-map-page__toast" role="status">
          {bookingToast}
        </p>
      )}

      {limitToast && (
        <p className="seat-map-page__toast seat-map-page__toast--warn" role="status">
          {limitToast}
        </p>
      )}

      {loading && <p className="seat-map-page__state">Loading seat map…</p>}
      {error && (
        <p className="seat-map-page__state seat-map-page__state--error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="seat-map">
          <div className="seat-map__stage" aria-hidden>
            STAGE
          </div>

          <div className="seat-map__sections-head" aria-hidden>
            <span />
            <span className="seat-map__section-title">Left</span>
            <span />
            <span className="seat-map__section-title">Center</span>
            <span />
            <span className="seat-map__section-title">Right</span>
          </div>

          <div className="seat-map__grid">
            {ROW_LABELS.map((row) => {
              const rowSeats = byRow.get(row) ?? []
              const { left, center, right } = bucketSeatsForRow(rowSeats)
              return (
                <div key={row} className="seat-map__row">
                  <div className="seat-map__row-label">{row}</div>
                  <div className="seat-map__block seat-map__block--left">
                    {left.map((seat) => (
                      <SeatButton
                        key={seat.seatNumber}
                        seat={seat}
                        selected={selected.has(seat.seatNumber)}
                        onToggle={toggle}
                      />
                    ))}
                  </div>
                  <div className="seat-map__aisle" aria-hidden />
                  <div className="seat-map__block seat-map__block--center">
                    {center.map((seat) => (
                      <SeatButton
                        key={seat.seatNumber}
                        seat={seat}
                        selected={selected.has(seat.seatNumber)}
                        onToggle={toggle}
                      />
                    ))}
                  </div>
                  <div className="seat-map__aisle" aria-hidden />
                  <div className="seat-map__block seat-map__block--right">
                    {right.map((seat) => (
                      <SeatButton
                        key={seat.seatNumber}
                        seat={seat}
                        selected={selected.has(seat.seatNumber)}
                        onToggle={toggle}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="seat-map__legend">
            <span className="seat-map__legend-title">Legend</span>
            <ul className="seat-map__legend-list">
              <li>
                <span className="seat-map__swatch seat-map__seat--p400" /> ₹ 400
              </li>
              <li>
                <span className="seat-map__swatch seat-map__seat--p300" /> ₹ 300
              </li>
              <li>
                <span className="seat-map__swatch seat-map__seat--p300c" /> ₹ 300 (center)
              </li>
              <li>
                <span className="seat-map__swatch seat-map__seat--p250" /> ₹ 250
              </li>
              <li>
                <span className="seat-map__swatch seat-map__seat--p200" /> ₹ 200
              </li>
              <li>
                <span className="seat-map__swatch seat-map__seat--muted" /> Booked / blocked
              </li>
              <li>
                <span className="seat-map__swatch seat-map__seat--selected seat-map__swatch--outline" />{' '}
                Selected
              </li>
            </ul>
          </div>

          {legendPrices.length > 0 && (
            <p className="seat-map__prices-note">
              Prices on this event: {legendPrices.map((p) => `₹${p}`).join(' · ')}
            </p>
          )}
        </div>
      )}

      {selectedSeats.length > 0 && (
        <footer className="seat-map-page__bar">
          <div className="seat-map-page__bar-inner">
            <div className="seat-map-page__bar-summary">
              <span>
                {selectedSeats.length}/{MAX_SEATS_PER_BOOKING} seat
                {selectedSeats.length === 1 ? '' : 's'}:{' '}
                {selectedSeats.map((s) => s.seatNumber).join(', ')}
              </span>
              <strong>Total ₹{total}</strong>
            </div>
            <div className="seat-map-page__bar-actions">
              {session ? (
                <button type="button" className="seat-map-page__confirm-btn" onClick={openConfirmDialog}>
                  Confirm seats
                </button>
              ) : (
                <p className="seat-map-page__bar-signin">
                  <Link to="/">Go to home</Link> and use <strong>Book ticket</strong> to sign in, then
                  confirm seats here.
                </p>
              )}
            </div>
          </div>
        </footer>
      )}

      {session && (
        <ConfirmSeatsDialog
          open={confirmDialogOpen}
          seatCount={selectedSeats.length}
          total={total}
          onCancel={closeConfirmDialog}
          onConfirm={handleConfirmDialogPrimary}
          submitting={confirmSubmitting}
          error={confirmError}
          adminMode={isAdmin}
          beneficiaryEmail={beneficiaryEmail}
          onBeneficiaryEmailChange={isAdmin ? setBeneficiaryEmail : undefined}
          beneficiaryHint={isAdmin && adminGuestOtpPhase === 'details' ? ADMIN_GUEST_EMAIL_HINT : null}
          adminGuestPhase={isAdmin ? adminGuestOtpPhase : 'details'}
          guestOtp={guestOtp}
          onGuestOtpChange={setGuestOtp}
          onGuestOtpBack={handleGuestOtpBack}
        />
      )}

      {session && paymentSnapshot && (
        <PaymentModal
          open={paymentOpen}
          onClose={closePayment}
          totalAmount={paymentSnapshot.totalAmount}
          lineItems={paymentSnapshot.lineItems}
          upiUri={paymentUpiUri}
        />
      )}
    </main>
  )
}
