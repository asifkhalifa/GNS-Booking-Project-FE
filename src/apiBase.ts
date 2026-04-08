/**
 * Frontend-only mode: calls external backend directly (e.g. Spring Boot).
 * Default local port matches this repo’s .env.example (override with NEXT_PUBLIC_API_BASE_URL).
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = (
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : 'http://localhost:9090'
  ).replace(/\/$/, '')
  return `${base}${p}`
}
