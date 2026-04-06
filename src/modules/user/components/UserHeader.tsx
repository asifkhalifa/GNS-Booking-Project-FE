'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '../context/UserProvider'

type Props = {
  onBookTicket: () => void
}

export function UserHeader({ onBookTicket }: Props) {
  const { session, signOut } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    document.body.classList.toggle('nav-menu-open', menuOpen)
    return () => document.body.classList.remove('nav-menu-open')
  }, [menuOpen])

  function closeMenu() {
    setMenuOpen(false)
  }

  function bookAndClose() {
    closeMenu()
    onBookTicket()
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand" onClick={closeMenu}>
          NAACH <span>&apos;26</span>
        </Link>
        <button
          type="button"
          className="site-header__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="visually-hidden">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          <span className="site-header__menu-icon" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        <nav id="site-nav" className={`site-header__nav ${menuOpen ? 'site-header__nav--open' : ''}`}>
          {session?.isAdmin ? (
            <Link
              href="/seats"
              className="btn btn--primary site-header__nav-link--admin-seats"
              onClick={closeMenu}
            >
              Seats / book for guest
            </Link>
          ) : (
            <Link href="/seats" className="btn btn--ghost" onClick={closeMenu}>
              Seats
            </Link>
          )}
          {session ? (
            session.isAdmin ? (
              <>
                <Link href="/admin/tickets" className="btn btn--ghost" onClick={closeMenu}>
                  View all tickets
                </Link>
                <Link href="/admin/profile" className="btn btn--ghost" onClick={closeMenu}>
                  My profile
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    closeMenu()
                    signOut()
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/tickets" className="btn btn--ghost" onClick={closeMenu}>
                  View tickets
                </Link>
                <Link href="/profile" className="btn btn--ghost" onClick={closeMenu}>
                  My profile
                </Link>
                <button type="button" className="btn btn--primary" onClick={bookAndClose}>
                  Book ticket
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    closeMenu()
                    signOut()
                  }}
                >
                  Sign out
                </button>
              </>
            )
          ) : (
            <button type="button" className="btn btn--primary" onClick={bookAndClose}>
              Book ticket
            </button>
          )}
        </nav>
      </div>
      {menuOpen && (
        <button
          type="button"
          className="site-header__backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}
    </header>
  )
}
