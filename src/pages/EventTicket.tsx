import { EVENT_INFO } from '../data/eventInfo'
import type { UserTicket } from '../modules/booking'

const POSTER = '/naach-ticket-poster.png'

export function ticketIsPaid(t: UserTicket): boolean {
  return t.status.replace(/\s/g, '').toUpperCase() === 'PAID'
}

function normStatus(t: UserTicket): string {
  return t.status.replace(/\s/g, '').toUpperCase()
}

type Props = { ticket: UserTicket }

export function EventTicket({ ticket }: Props) {
  const paid = ticketIsPaid(ticket)
  const st = normStatus(ticket)
  const waitingApproval = st === 'PAYMENT_PENDING'
  return (
    <article
      className={`event-ticket ${paid ? 'event-ticket--paid' : 'event-ticket--pending'}`}
      aria-label={`Ticket for seat ${ticket.seatNumber}`}
    >
      <div className="event-ticket__frame">
        {!paid && (
          <div className="event-ticket__overlay" role="status">
            <span className="event-ticket__overlay-text">
              {waitingApproval ? 'Waiting for approval' : 'Payment pending'}
            </span>
            {!waitingApproval && (
              <span className="event-ticket__overlay-sub">Complete payment to unlock this ticket</span>
            )}
          </div>
        )}
        <div className="event-ticket__body">
          <div className="event-ticket__poster" style={{ backgroundImage: `url(${POSTER})` }} aria-hidden />
          <div className="event-ticket__wash" aria-hidden />
          <div className="event-ticket__content">
            <header className="event-ticket__hero">
              <p className="event-ticket__presenter">
                <span className="event-ticket__presenter-line" aria-hidden />
                <span className="event-ticket__presenter-inner">{EVENT_INFO.presenter}</span>
                <span className="event-ticket__presenter-line" aria-hidden />
              </p>
              <h2 className="event-ticket__logo">
                {EVENT_INFO.title}
                <span className="event-ticket__logo-year">{EVENT_INFO.titleYear}</span>
              </h2>
              <div className="event-ticket__theme-banner">
                <div className="event-ticket__theme-ribbon">
                  <span className="event-ticket__theme-label">{EVENT_INFO.themeLabel}</span>
                  <span className="event-ticket__theme-name">{EVENT_INFO.theme}</span>
                </div>
              </div>
            </header>
            {ticket.ownerEmail && (
              <p className="event-ticket__owner">
                <span className="event-ticket__owner-k">Booked for</span>
                <span className="event-ticket__owner-v">{ticket.ownerEmail}</span>
              </p>
            )}
            <div className="event-ticket__seat">
              <span className="event-ticket__seat-k">Seat</span>
              <span className="event-ticket__seat-v">{ticket.seatNumber}</span>
            </div>
            {ticket.price != null && Number.isFinite(ticket.price) && (
              <p className="event-ticket__amount">
                <span className="event-ticket__amount-k">Amount</span>
                <span className="event-ticket__amount-v">₹{ticket.price}</span>
              </p>
            )}
            <div className="event-ticket__meta">
              <div>
                <span className="event-ticket__meta-k">{EVENT_INFO.dateLabel}</span>
                <p className="event-ticket__meta-v">{EVENT_INFO.dateLine}</p>
              </div>
              <div>
                <span className="event-ticket__meta-k">{EVENT_INFO.venueLabel}</span>
                <p className="event-ticket__meta-v">{EVENT_INFO.venue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
