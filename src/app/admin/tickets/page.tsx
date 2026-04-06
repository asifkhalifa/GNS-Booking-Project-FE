import { Suspense } from 'react'
import { AdminTicketsPage } from '@/modules/admin/pages/AdminTicketsPage'

export default function AdminTicketsRoutePage() {
  return (
    <Suspense fallback={<p className="tickets-page__status">Loading…</p>}>
      <AdminTicketsPage />
    </Suspense>
  )
}
