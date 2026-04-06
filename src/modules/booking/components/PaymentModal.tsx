'use client'

import { useCallback, useEffect, useState } from 'react'
import { PAYMENT_CONFIG } from '../../../data/paymentConfig'

export type PaymentLineItem = {
  seatNumber: string
  price: number
}

type Props = {
  open: boolean
  onClose: () => void
  totalAmount: number
  lineItems: PaymentLineItem[]
  /** upi:// link with pa + am so "Open in UPI app" sends the correct total */
  upiUri: string
}

export function PaymentModal({ open, onClose, totalAmount, lineItems, upiUri }: Props) {
  const { upiId, payeeName, staticQrImagePath } = PAYMENT_CONFIG
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) setCopied(false)
  }, [open])

  const copyUpi = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(upiId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [upiId])

  if (!open) return null

  return (
    <div className="pay-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="pay-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="pay-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 id="pay-modal-title" className="pay-modal__title">
          Pay with UPI
        </h2>
        <p className="pay-modal__sub">
          Your seats are <strong>already saved</strong>. Scan the QR below and pay exactly the total
          shown (or use <strong>Open in UPI app</strong> to prefill the amount).
        </p>

        <div className="pay-modal__amount-hero" aria-live="polite">
          <span className="pay-modal__amount-label">Amount to pay</span>
          <strong className="pay-modal__amount-value">₹{totalAmount}</strong>
        </div>

        <div className="pay-modal__summary pay-modal__summary--compact">
          <span className="pay-modal__summary-label">Confirmed seats</span>
          <ul className="pay-modal__lines">
            {lineItems.map((row) => (
              <li key={row.seatNumber}>
                <span>{row.seatNumber}</span>
                <span>₹{row.price}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pay-modal__qr-wrap pay-modal__qr-wrap--static">
          <div className="pay-modal__qr-box pay-modal__qr-box--photo">
            <img
              src={staticQrImagePath}
              alt={`UPI QR — pay ₹${totalAmount} to ${payeeName}`}
              className="pay-modal__qr-photo"
              width={260}
              height={260}
              decoding="async"
            />
          </div>
          <p className="pay-modal__qr-hint">Scan with Paytm, PhonePe, Google Pay, or any UPI app</p>
          <p className="pay-modal__qr-amount-note">
            If the app asks for amount, enter <strong>₹{totalAmount}</strong>.
          </p>
        </div>

        <div className="pay-modal__upi pay-modal__upi--inline">
          <span className="pay-modal__upi-label">UPI ID</span>
          <div className="pay-modal__upi-row">
            <code className="pay-modal__upi-id">{upiId}</code>
            <button type="button" className="pay-modal__copy-btn" onClick={copyUpi}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="pay-modal__payee">
            Payee: <span>{payeeName}</span>
          </p>
        </div>

        <a className="pay-modal__upi-link" href={upiUri}>
          Open in UPI app (amount ₹{totalAmount} prefilled)
        </a>

        <div className="pay-modal__actions pay-modal__actions--single">
          <button type="button" className="pay-modal__primary pay-modal__primary--full" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
