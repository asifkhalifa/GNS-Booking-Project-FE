/**
 * Frontend-only mode: calls external backend directly (e.g. Spring Boot).
 * Default points to local Spring Boot on :8080.
 */
export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = (
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL
      : 'http://localhost:8080'
  ).replace(/\/$/, '')
  return `${base}${p}`
}
