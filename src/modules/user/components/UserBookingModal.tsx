import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sendOtp, verifyOtp } from '../api/userApi'
import { useUser } from '../context/UserProvider'
import { interpretVerifyOtpResponse } from '../lib/parseIsAdmin'

type Step = 'email' | 'otp'

type Props = {
  open: boolean
  onClose: () => void
}

export function UserBookingModal({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { setSession } = useUser()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setStep('email')
    setEmail('')
    setOtp('')
    setError(null)
    setLoading(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter your email.')
      return
    }
    setLoading(true)
    try {
      await sendOtp(trimmed)
      setStep('otp')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedEmail = email.trim()
    const trimmedOtp = otp.trim()
    if (!trimmedOtp) {
      setError('Please enter the OTP from your email.')
      return
    }
    setLoading(true)
    try {
      const body = await verifyOtp(trimmedEmail, trimmedOtp)
      const parsed = interpretVerifyOtpResponse(body)
      if (!parsed.ok) {
        setError(parsed.message)
        return
      }
      setSession({ email: trimmedEmail, profile: parsed.profile, isAdmin: parsed.isAdmin })
      handleClose()
      navigate(parsed.isAdmin ? '/admin/profile' : '/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <button type="button" className="modal__close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        <h2 id="booking-modal-title" className="modal__title">
          Book NAACH &apos;26 — verify your email
        </h2>
        <p className="modal__hint">
          We will email you a one-time code. Use the same address you registered with for the event.
        </p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="modal__form">
            <label className="field">
              <span className="field__label">Email</span>
              <input
                type="email"
                autoComplete="email"
                className="field__input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />
            </label>
            {error && <p className="field__error">{error}</p>}
            <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="modal__form">
            <p className="modal__email-sent">
              Code sent to <strong>{email.trim()}</strong>
            </p>
            <label className="field">
              <span className="field__label">One-time code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="field__input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                disabled={loading}
              />
            </label>
            {error && <p className="field__error">{error}</p>}
            <div className="modal__actions">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={loading}
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setError(null)
                }}
              >
                Change email
              </button>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? 'Verifying…' : 'Verify & continue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
