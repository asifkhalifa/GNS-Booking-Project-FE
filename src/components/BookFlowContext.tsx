'use client'

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { UserBookingModal, useUser } from '@/modules/user'

const BookFlowContext = createContext<(() => void) | null>(null)

export function useBookFlow(): () => void {
  const fn = useContext(BookFlowContext)
  return fn ?? (() => {})
}

export function BookFlowProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { session } = useUser()
  const [bookingOpen, setBookingOpen] = useState(false)

  const openBookFlow = useCallback(() => {
    if (session) router.push('/seats')
    else setBookingOpen(true)
  }, [session, router])

  return (
    <BookFlowContext.Provider value={openBookFlow}>
      {children}
      <UserBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </BookFlowContext.Provider>
  )
}
