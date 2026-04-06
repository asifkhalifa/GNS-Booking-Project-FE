import { apiUrl } from '../../../apiBase'

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

export async function lockSeats(email: string, seatNumbers: string[]): Promise<void> {
  const res = await fetch(apiUrl('/seat/lock'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, seatNumbers }),
  })
  if (!res.ok) throw new Error(await parseError(res))
}

export async function unlockSeats(email: string, seatNumbers: string[]): Promise<void> {
  const res = await fetch(apiUrl('/seat/unlock'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, seatNumbers }),
  })
  if (!res.ok) throw new Error(await parseError(res))
}
