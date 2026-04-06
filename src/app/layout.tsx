import type { Metadata } from 'next'
import { UserProvider } from '@/modules/user'
import { AppShell } from '@/components/AppShell'
import '../index.css'

export const metadata: Metadata = {
  title: "NAACH '26 — Booking",
  description: 'Seat booking for NAACH',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <AppShell>{children}</AppShell>
        </UserProvider>
      </body>
    </html>
  )
}
