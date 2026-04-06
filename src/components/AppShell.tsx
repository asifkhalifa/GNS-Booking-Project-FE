'use client'

import { BookFlowProvider } from '@/components/BookFlowContext'
import { UserHeader } from '@/modules/user'
import { useBookFlow } from '@/components/BookFlowContext'

function HeaderWithBook() {
  const openBookFlow = useBookFlow()
  return <UserHeader onBookTicket={openBookFlow} />
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BookFlowProvider>
      <div className="app">
        <HeaderWithBook />
        {children}
      </div>
    </BookFlowProvider>
  )
}
