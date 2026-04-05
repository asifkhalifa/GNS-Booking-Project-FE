export type AdminGuestPhase = 'details' | 'guest_otp'

type Props = {
  open: boolean
  seatCount: number
  total: number
  onCancel: () => void
  onConfirm: () => void
  submitting: boolean
  error: string | null
  adminMode?: boolean
  beneficiaryEmail?: string
  onBeneficiaryEmailChange?: (value: string) => void
  beneficiaryHint?: string | null
  /** After OTP is sent to a new guest, collect code before saving booking. */
  adminGuestPhase?: AdminGuestPhase
  guestOtp?: string
  onGuestOtpChange?: (value: string) => void
  onGuestOtpBack?: () => void
}

export function ConfirmSeatsDialog({
  open,
  seatCount,
  total,
  onCancel,
  onConfirm,
  submitting,
  error,
  adminMode = false,
  beneficiaryEmail = '',
  onBeneficiaryEmailChange,
  beneficiaryHint,
  adminGuestPhase = 'details',
  guestOtp = '',
  onGuestOtpChange,
  onGuestOtpBack,
}: Props) {
  if (!open) return null

  const otpStep = adminMode && adminGuestPhase === 'guest_otp'

  return (
    <div className="confirm-seats-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="confirm-seats-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-seats-title"
        aria-describedby="confirm-seats-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-seats-title" className="confirm-seats-dialog__title">
          {otpStep ? 'Verify guest — OTP' : adminMode ? 'Confirm seats for guest?' : 'Confirm your seats?'}
        </h2>
        {otpStep ? (
          <>
            <p id="confirm-seats-desc" className="confirm-seats-dialog__body">
              We sent a one-time code to <strong>{beneficiaryEmail.trim()}</strong>. Enter it below —
              verify updates their session on the server (new users get a profile; existing users are not
              duplicated). Then the booking for <strong>₹{total}</strong> is saved.
            </p>
            <label className="confirm-seats-dialog__field field">
              <span className="field__label">Guest OTP</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="field__input"
                value={guestOtp}
                onChange={(e) => onGuestOtpChange?.(e.target.value)}
                placeholder="Enter OTP from their email"
                disabled={submitting}
              />
            </label>
          </>
        ) : (
          <>
            <p id="confirm-seats-desc" className="confirm-seats-dialog__body">
              You are about to confirm <strong>{seatCount}</strong> seat{seatCount === 1 ? '' : 's'} for{' '}
              <strong>₹{total}</strong>
              {adminMode ? (
                <>
                  {' '}
                  for the <strong>guest email</strong> below. We email them a code first; after verify,
                  the server only creates a user row if they are new—then you save the booking.
                </>
              ) : (
                '.'
              )}
            </p>

            {adminMode && onBeneficiaryEmailChange && (
              <label className="confirm-seats-dialog__field field">
                <span className="field__label">Guest email (booking owner)</span>
                <input
                  type="email"
                  autoComplete="email"
                  className="field__input"
                  value={beneficiaryEmail}
                  onChange={(e) => onBeneficiaryEmailChange(e.target.value)}
                  placeholder="guest@example.com"
                  disabled={submitting}
                />
                {beneficiaryHint != null && beneficiaryHint !== '' && (
                  <span className="confirm-seats-dialog__hint">{beneficiaryHint}</span>
                )}
              </label>
            )}

            <p className="confirm-seats-dialog__warning">
              Once you confirm, you <strong>cannot cancel</strong> this selection in the app. Your booking
              will be saved on the server immediately (after any required guest verification).
            </p>
            <p className="confirm-seats-dialog__question">Are you sure you want to continue?</p>
          </>
        )}

        {error && (
          <p className="confirm-seats-dialog__error" role="alert">
            {error}
          </p>
        )}

        <div className="confirm-seats-dialog__actions">
          {otpStep ? (
            <>
              <button
                type="button"
                className="confirm-seats-dialog__btn confirm-seats-dialog__btn--secondary"
                onClick={() => onGuestOtpBack?.()}
                disabled={submitting}
              >
                Change email
              </button>
              <button
                type="button"
                className="confirm-seats-dialog__btn confirm-seats-dialog__btn--primary"
                onClick={onConfirm}
                disabled={submitting || seatCount === 0}
              >
                {submitting ? 'Saving…' : 'Verify OTP & save booking'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="confirm-seats-dialog__btn confirm-seats-dialog__btn--secondary"
                onClick={onCancel}
                disabled={submitting}
              >
                No, go back
              </button>
              <button
                type="button"
                className="confirm-seats-dialog__btn confirm-seats-dialog__btn--primary"
                onClick={onConfirm}
                disabled={submitting || seatCount === 0}
              >
                {submitting ? 'Working…' : 'Yes, confirm seats'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
