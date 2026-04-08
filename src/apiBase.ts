/**
 * Vite + React: backend base URL from `VITE_API_URL` (no trailing slash).
 * Example: http://localhost:9090 or http://localhost:9090/api
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const raw = import.meta.env.VITE_API_URL?.trim()
  const base = (raw && raw.length > 0 ? raw : 'http://localhost:9090').replace(/\/$/, '')
  return `${base}${p}`
}
