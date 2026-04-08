/**
 * UPI checkout — static Paytm QR + VPA. Override via Vite env when needed.
 */
export const PAYMENT_CONFIG = {
  upiId: import.meta.env.VITE_UPI_ID ?? '7738612015@ptaxis',
  payeeName: import.meta.env.VITE_UPI_PAYEE_NAME ?? 'Charmi Shailesh Shah',
  staticQrImagePath: import.meta.env.VITE_UPI_QR_IMAGE ?? '/upi-paytm-qr.png',
} as const
