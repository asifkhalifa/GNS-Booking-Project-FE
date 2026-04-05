import { API_BASE_URL } from '../../../apiBase'

const base = API_BASE_URL

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json()
    if (typeof data === 'object' && data && 'message' in data) {
      return String((data as { message: unknown }).message)
    }
    return res.statusText || 'Request failed'
  } catch {
    return res.statusText || 'Request failed'
  }
}

export async function sendOtp(email: string): Promise<void> {
  const res = await fetch(`${base}/user/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(await parseError(res))
}

/**
 * Optional: GET /user/exists?email=… — returns { exists: boolean }.
 * Returns null if the endpoint is missing or errors (admin booking still allowed).
 */
export async function checkUserExists(email: string): Promise<boolean | null> {
  const q = encodeURIComponent(email.trim())
  try {
    const res = await fetch(`${base}/user/exists?email=${q}`)
    if (!res.ok) return null
    const data: unknown = await res.json()
    if (data && typeof data === 'object' && 'exists' in data) {
      return Boolean((data as { exists: unknown }).exists)
    }
    return null
  } catch {
    return null
  }
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<unknown> {
  const res = await fetch(`${base}/user/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  })
  if (!res.ok) throw new Error(await parseError(res))
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}
