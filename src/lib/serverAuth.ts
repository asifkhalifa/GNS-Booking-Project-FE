/** Lowercase trimmed emails that may use admin UI (comma-separated in env). */
export function getAdminEmailSet(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || ''
  const set = new Set<string>()
  for (const part of raw.split(/[,;\s]+/)) {
    const e = part.trim().toLowerCase()
    if (e) set.add(e)
  }
  return set
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmailSet().has(email.trim().toLowerCase())
}
