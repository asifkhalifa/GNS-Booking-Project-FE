export type SeatSection = 'LEFT' | 'CENTER' | 'RIGHT' | 'BLOCKED'

export type SeatStatus = 'AVAILABLE' | 'BOOKED' | string

export type Seat = {
  seatNumber: string
  rowName: string
  section: SeatSection
  price: number
  status: SeatStatus
}
