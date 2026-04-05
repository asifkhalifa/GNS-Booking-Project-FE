export function isValidEmail(s: string): boolean {
  const t = s.trim()
  return t.length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}
