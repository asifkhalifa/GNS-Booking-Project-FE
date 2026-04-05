/** Reads admin flag from verify-otp body (object or legacy shapes). */
export function parseIsAdminFromProfile(profile: unknown): boolean {
  if (profile === true) return true
  if (profile === false) return false
  if (typeof profile === 'string') {
    const s = profile.trim().toLowerCase()
    if (s === 'true') return true
    if (s === 'false') return false
    return false
  }
  if (!profile || typeof profile !== 'object') return false
  const o = profile as Record<string, unknown>
  const v = o.isAdmin ?? o.admin ?? o.is_admin
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    return s === 'true' || s === '1' || s === 'yes'
  }
  if (typeof v === 'number') return v === 1
  return false
}

export type VerifyOtpInterpretation =
  | { ok: true; isAdmin: boolean; profile: unknown }
  | { ok: false; message: string }

/**
 * Spring controller returns `ResponseEntity.ok(user.isAdmin())` → JSON body is `true` or `false`.
 * On error it may return `ResponseEntity.ok(e.getMessage())` → JSON string (still 200).
 */
export function interpretVerifyOtpResponse(body: unknown): VerifyOtpInterpretation {
  if (typeof body === 'boolean') {
    return { ok: true, isAdmin: body, profile: { isAdmin: body } }
  }
  if (typeof body === 'string') {
    const t = body.trim()
    if (t === '') return { ok: false, message: 'Verification failed.' }
    const lower = t.toLowerCase()
    if (lower === 'true') return { ok: true, isAdmin: true, profile: { isAdmin: true } }
    if (lower === 'false') return { ok: true, isAdmin: false, profile: { isAdmin: false } }
    return { ok: false, message: t }
  }
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const isAdmin = parseIsAdminFromProfile(body)
    return { ok: true, isAdmin, profile: body }
  }
  if (body === null || body === undefined) {
    return { ok: true, isAdmin: false, profile: {} }
  }
  return { ok: false, message: 'Unexpected response from server.' }
}
