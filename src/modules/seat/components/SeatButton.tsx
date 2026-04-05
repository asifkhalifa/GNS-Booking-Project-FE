import type { Seat } from '../types'
import { isSeatSelectable, seatVisualClass } from '../lib/seatLayout'

type Props = {
  seat: Seat
  selected: boolean
  onToggle: (seat: Seat) => void
}

export function SeatButton({ seat, selected, onToggle }: Props) {
  const selectable = isSeatSelectable(seat)
  const visual = seatVisualClass(seat)

  return (
    <button
      type="button"
      className={[
        'seat-map__seat',
        visual,
        selected ? 'seat-map__seat--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={!selectable}
      title={
        selectable
          ? `${seat.seatNumber} · ₹${seat.price}`
          : `${seat.seatNumber} · ${seat.status === 'BOOKED' ? 'Booked' : 'Not available'}`
      }
      onClick={() => selectable && onToggle(seat)}
    >
      <span className="seat-map__seat-label">{seat.seatNumber}</span>
    </button>
  )
}
