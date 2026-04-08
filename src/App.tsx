import { Suspense, lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { UserProvider } from '@/modules/user'
import { Home } from '@/views/Home'
import { TicketsPage } from '@/views/TicketsPage'
import { SeatMapPage } from '@/modules/seat'
import { UserProfilePage } from '@/modules/user/pages/UserProfilePage'
import { AdminProfilePage } from '@/modules/admin/pages/AdminProfilePage'
import { useBookFlow } from '@/components/BookFlowContext'

const AdminTicketsPage = lazy(() =>
  import('@/modules/admin/pages/AdminTicketsPage').then((m) => ({ default: m.AdminTicketsPage }))
)

function HomeRoute() {
  const onBookTicket = useBookFlow()
  return <Home onBookTicket={onBookTicket} />
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomeRoute />} />
            <Route path="/seats" element={<SeatMapPage />} />
            <Route path="/profile" element={<UserProfilePage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/admin/profile" element={<AdminProfilePage />} />
            <Route
              path="/admin/tickets"
              element={
                <Suspense fallback={<p className="tickets-page__status">Loading…</p>}>
                  <AdminTicketsPage />
                </Suspense>
              }
            />
          </Routes>
        </AppShell>
      </UserProvider>
    </BrowserRouter>
  )
}
