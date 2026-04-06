'use client'

import { Home } from '@/views/Home'
import { useBookFlow } from '@/components/BookFlowContext'

export default function HomePage() {
  const onBookTicket = useBookFlow()
  return <Home onBookTicket={onBookTicket} />
}
