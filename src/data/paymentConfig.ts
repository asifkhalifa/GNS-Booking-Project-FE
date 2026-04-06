/**
 * UPI checkout — your static Paytm QR + VPA. Override via env when needed.
 * Amount is always the live seat total in the UI; "Open in UPI app" prefills it via upi://
 */
export const PAYMENT_CONFIG = {
  upiId: process.env.NEXT_PUBLIC_UPI_ID ?? '7738612015@ptaxis',
  payeeName: process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? 'Charmi Shailesh Shah',
  /** Static QR image in /public (your Paytm UPI QR) */
  staticQrImagePath: process.env.NEXT_PUBLIC_UPI_QR_IMAGE ?? '/upi-paytm-qr.png',
} as const
