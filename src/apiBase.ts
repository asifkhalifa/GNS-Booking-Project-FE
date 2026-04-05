/** Default backend for local dev — user, seat, and booking APIs all use this origin. */
export const BACKEND_URL_LOCAL = 'http://localhost:9090'

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim()

/**
 * Base URL for every `fetch()` to your API.
 * - Local: `http://localhost:9090` (or match `BACKEND_URL_LOCAL`)
 * - Override: set `VITE_API_BASE_URL` in `.env` / `.env.production`
 */
export const API_BASE_URL = normalizeOrigin(fromEnv || BACKEND_URL_LOCAL)
