import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserBookingModal, useUser } from '@/modules/user'

const BookFlowContext = createContext<(() => void) | null>(null)

export function useBookFlow(): () => void {
  const fn = useContext(BookFlowContext)
  return fn ?? (() => {})
}

export function BookFlowProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const { session } = useUser()
  const [bookingOpen, setBookingOpen] = useState(false)

  const openBookFlow = useCallback(() => {
    if (session) navigate('/seats')
    else setBookingOpen(true)
  }, [session, navigate])

  return (
    <BookFlowContext.Provider value={openBookFlow}>
      {children}
      <UserBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </BookFlowContext.Provider>
  )
}
