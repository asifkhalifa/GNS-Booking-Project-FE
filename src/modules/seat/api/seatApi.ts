import { API_BASE_URL } from '../../../apiBase'
import type { Seat } from '../types'

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

export async function fetchAllSeats(): Promise<Seat[]> {
  const res = await fetch(`${base}/seat/all/get`)
  if (!res.ok) throw new Error(await parseError(res))
  const data: unknown = await res.json()
  if (!Array.isArray(data)) return []
  return (data as Seat[]).map((s) => ({
    ...s,
    rowName: String(s.rowName).toUpperCase(),
    section: String(s.section).toUpperCase() as Seat['section'],
    seatNumber: String(s.seatNumber),
    status: String(s.status),
  }))
}
