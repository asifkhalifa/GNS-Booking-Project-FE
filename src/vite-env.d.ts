/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin, e.g. http://localhost:9090 */
  readonly VITE_API_BASE_URL?: string
  readonly VITE_UPI_ID?: string
  readonly VITE_UPI_PAYEE_NAME?: string
  /** Path under /public, e.g. /upi-paytm-qr.png */
  readonly VITE_UPI_QR_IMAGE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
