import { useState } from 'react'
import { Route, Routes, useNavigate } from 'react-router-dom'
import {
  UserBookingModal,
  UserHeader,
  UserProfilePage,
  useUser,
} from './modules/user'
import { AdminProfilePage, AdminTicketsPage } from './modules/admin'
import { SeatMapPage } from './modules/seat'
import { Home } from './pages/Home'
import { TicketsPage } from './pages/TicketsPage'

export default function App() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const navigate = useNavigate()
  const { session } = useUser()

  function handleBookTicket() {
    if (session) navigate('/seats')
    else setBookingOpen(true)
  }

  return (
    <div className="app">
      <UserHeader onBookTicket={handleBookTicket} />
      <Routes>
        <Route path="/" element={<Home onBookTicket={handleBookTicket} />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/seats" element={<SeatMapPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
        <Route path="/admin/tickets" element={<AdminTicketsPage />} />
      </Routes>
      <UserBookingModal open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  )
}
