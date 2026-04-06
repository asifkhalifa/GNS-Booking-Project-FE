import type { Seat, SeatSection } from '@/modules/seat/types'

type Band = { from: number; to: number; section: SeatSection; price: number }

function addRowBands(out: Seat[], row: string, bands: readonly Band[], status: Seat['status'] = 'AVAILABLE') {
  for (const { from, to, section, price } of bands) {
    for (let n = from; n <= to; n++) {
      out.push({
        seatNumber: `${row}${n}`,
        rowName: row,
        section,
        price,
        status,
      })
    }
  }
}

/** Rows A, B, C, R, S: 30 seats each, blocked / not for sale (matches SQL BLOCKED + BOOKED). */
function addBlockedRows(out: Seat[], rows: readonly string[]) {
  for (const row of rows) {
    for (let i = 1; i <= 30; i++) {
      out.push({
        seatNumber: `${row}${i}`,
        rowName: row,
        section: 'BLOCKED',
        price: 0,
        status: 'BOOKED',
      })
    }
  }
}

const BANDS_LIKE_D: Band[] = [
  { from: 1, to: 8, section: 'LEFT', price: 300 },
  { from: 9, to: 19, section: 'CENTER', price: 400 },
  { from: 20, to: 27, section: 'RIGHT', price: 300 },
]

const BANDS_E: Band[] = [
  { from: 1, to: 8, section: 'LEFT', price: 300 },
  { from: 9, to: 18, section: 'CENTER', price: 400 },
  { from: 19, to: 26, section: 'RIGHT', price: 300 },
]

const BANDS_F: Band[] = BANDS_LIKE_D

const BANDS_G: Band[] = [
  { from: 1, to: 9, section: 'LEFT', price: 300 },
  { from: 10, to: 19, section: 'CENTER', price: 400 },
  { from: 20, to: 28, section: 'RIGHT', price: 300 },
]

const BANDS_H: Band[] = [
  { from: 1, to: 9, section: 'LEFT', price: 250 },
  { from: 10, to: 20, section: 'CENTER', price: 300 },
  { from: 21, to: 29, section: 'RIGHT', price: 250 },
]

const BANDS_I: Band[] = [
  { from: 1, to: 9, section: 'LEFT', price: 250 },
  { from: 10, to: 19, section: 'CENTER', price: 300 },
  { from: 20, to: 28, section: 'RIGHT', price: 250 },
]

const BANDS_J: Band[] = BANDS_H

const BANDS_K: Band[] = [
  { from: 1, to: 8, section: 'LEFT', price: 250 },
  { from: 9, to: 18, section: 'CENTER', price: 300 },
  { from: 19, to: 26, section: 'RIGHT', price: 250 },
]

const BANDS_L: Band[] = [
  { from: 1, to: 8, section: 'LEFT', price: 250 },
  { from: 9, to: 19, section: 'CENTER', price: 300 },
  { from: 20, to: 28, section: 'RIGHT', price: 250 },
]

const BANDS_M: Band[] = [
  { from: 1, to: 8, section: 'LEFT', price: 200 },
  { from: 9, to: 19, section: 'CENTER', price: 200 },
  { from: 20, to: 27, section: 'RIGHT', price: 200 },
]

const BANDS_N: Band[] = [
  { from: 1, to: 8, section: 'LEFT', price: 200 },
  { from: 9, to: 18, section: 'CENTER', price: 200 },
  { from: 19, to: 26, section: 'RIGHT', price: 200 },
]

const BANDS_O: Band[] = [
  { from: 1, to: 9, section: 'LEFT', price: 200 },
  { from: 10, to: 20, section: 'CENTER', price: 200 },
  { from: 21, to: 29, section: 'RIGHT', price: 200 },
]

const BANDS_P: Band[] = [
  { from: 1, to: 9, section: 'LEFT', price: 200 },
  { from: 10, to: 19, section: 'CENTER', price: 200 },
  { from: 20, to: 28, section: 'RIGHT', price: 200 },
]

const BANDS_Q: Band[] = BANDS_P

/**
 * Venue layout aligned with SQL: rows A/B/C/R/S are BLOCKED + BOOKED (30 seats each);
 * rows D–Q follow the priced chart.
 *
 * To apply on an existing project, reseed seats (e.g. POST /api/admin/reseed-seats).
 */
export function buildInitialSeats(): Seat[] {
  const out: Seat[] = []

  addBlockedRows(out, ['A', 'B', 'C', 'R', 'S'])

  addRowBands(out, 'D', BANDS_LIKE_D)
  addRowBands(out, 'E', BANDS_E)
  addRowBands(out, 'F', BANDS_F)
  addRowBands(out, 'G', BANDS_G)
  addRowBands(out, 'H', BANDS_H)
  addRowBands(out, 'I', BANDS_I)
  addRowBands(out, 'J', BANDS_J)
  addRowBands(out, 'K', BANDS_K)
  addRowBands(out, 'L', BANDS_L)
  addRowBands(out, 'M', BANDS_M)
  addRowBands(out, 'N', BANDS_N)
  addRowBands(out, 'O', BANDS_O)
  addRowBands(out, 'P', BANDS_P)
  addRowBands(out, 'Q', BANDS_Q)

  return out
}
