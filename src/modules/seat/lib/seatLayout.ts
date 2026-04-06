import type { Seat, SeatSection } from '../types'

/** Rows A–S as on the venue chart */
export const ROW_LABELS = 'ABCDEFGHIJKLMNOPQRS'.split('') as string[]

export function seatNumericOrder(seatNumber: string): number {
  const m = seatNumber.match(/(\d+)$/)
  return m ? parseInt(m[1], 10) : 0
}

function sortBySeatNumber(a: Seat, b: Seat): number {
  return seatNumericOrder(a.seatNumber) - seatNumericOrder(b.seatNumber)
}

/** Map BLOCKED seats into a visual column using seat number bands (left / center / right). */
export function visualColumnForSeat(seat: Seat): 'left' | 'center' | 'right' {
  const s = seat.section as SeatSection
  if (s === 'LEFT') return 'left'
  if (s === 'CENTER') return 'center'
  if (s === 'RIGHT') return 'right'
  const n = seatNumericOrder(seat.seatNumber)
  if (n <= 8) return 'left'
  if (n <= 19) return 'center'
  return 'right'
}

export type RowBuckets = {
  left: Seat[]
  center: Seat[]
  right: Seat[]
}

export function bucketSeatsForRow(seats: Seat[]): RowBuckets {
  const left: Seat[] = []
  const center: Seat[] = []
  const right: Seat[] = []
  for (const seat of seats) {
    const col = visualColumnForSeat(seat)
    if (col === 'left') left.push(seat)
    else if (col === 'center') center.push(seat)
    else right.push(seat)
  }
  left.sort(sortBySeatNumber)
  center.sort(sortBySeatNumber)
  right.sort(sortBySeatNumber)
  return { left, center, right }
}

export function groupSeatsByRow(seats: Seat[]): Map<string, Seat[]> {
  const map = new Map<string, Seat[]>()
  for (const seat of seats) {
    const row = seat.rowName.toUpperCase()
    const list = map.get(row) ?? []
    list.push(seat)
    map.set(row, list)
  }
  return map
}

export function seatVisualClass(seat: Seat): string {
  const unavailable =
    seat.status === 'BOOKED' ||
    seat.status === 'LOCKED' ||
    seat.section === 'BLOCKED' ||
    seat.price <= 0
  if (unavailable) return 'seat-map__seat--muted'

  const { price, section } = seat
  if (price === 200) return 'seat-map__seat--p200'
  if (price === 250) return 'seat-map__seat--p250'
  if (price === 300)
    return section === 'CENTER' ? 'seat-map__seat--p300c' : 'seat-map__seat--p300'
  if (price === 400) return 'seat-map__seat--p400'
  return 'seat-map__seat--default'
}

export function isSeatSelectable(seat: Seat): boolean {
  return (
    seat.status === 'AVAILABLE' && seat.section !== 'BLOCKED' && seat.price > 0
  )
}
