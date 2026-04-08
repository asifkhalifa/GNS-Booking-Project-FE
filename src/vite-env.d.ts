/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_UPI_ID?: string
  readonly VITE_UPI_PAYEE_NAME?: string
  readonly VITE_UPI_QR_IMAGE?: string
  readonly VITE_ADMIN_BOOKINGS_STATIC?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
