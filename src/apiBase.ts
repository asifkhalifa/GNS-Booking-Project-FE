/**
 * API routes live under `/api/*` on the same Next.js host.
 * Set NEXT_PUBLIC_API_BASE_URL only if the browser calls a different origin (rare).
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : ''
  ).replace(/\/$/, '')
  return `${base}/api${p}`
}
