import { EVENT_INFO } from '../data/eventInfo'

type Props = {
  onBookTicket: () => void
}

export function Home({ onBookTicket }: Props) {
  const e = EVENT_INFO

  return (
    <main className="event-home">
      <section className="event-home__hero" aria-label="NAACH twenty twenty-six">
        <div className="event-home__hero-art" aria-hidden>
          <div className="event-home__hero-rays" />
          <div className="event-home__hero-bloom" />
          <div className="event-home__hero-stars" />
        </div>
        <div className="event-home__hero-fade" aria-hidden />
        <div className="event-home__hero-content">
          <p className="event-home__presenter">{e.presenter}</p>
          <h1 className="event-home__title">
            <span className="event-home__title-main">{e.title}</span>
            <span className="event-home__title-year">{e.titleYear}</span>
          </h1>
          <p className="event-home__theme">
            <span className="event-home__theme-label">{e.themeLabel}:</span>{' '}
            <span className="event-home__theme-text">{e.theme}</span>
          </p>
        </div>
      </section>

      <section className="event-home__details" aria-labelledby="event-details-heading">
        <h2 id="event-details-heading" className="visually-hidden">
          Event date and venue
        </h2>
        <div className="event-home__banner">
          <span className="event-home__banner-label">{e.dateLabel}</span>
          <p className="event-home__banner-text">{e.dateLine}</p>
        </div>
        <div className="event-home__banner">
          <span className="event-home__banner-label">{e.venueLabel}</span>
          <p className="event-home__banner-text">{e.venue}</p>
        </div>

        <div className="event-home__cta">
          <button type="button" className="event-home__book-btn" onClick={onBookTicket}>
            Book ticket
          </button>
          <p className="event-home__cta-hint">
            Signed in? You&apos;ll go straight to seat selection. Otherwise we&apos;ll verify your email
            first.
          </p>
        </div>
      </section>
    </main>
  )
}
