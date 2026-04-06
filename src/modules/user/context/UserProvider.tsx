'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { parseIsAdminFromProfile } from '../lib/parseIsAdmin'

export type UserSession = {
  email: string
  profile: unknown
  /** When true, user sees admin navigation and flows. */
  isAdmin?: boolean
}

type UserContextValue = {
  session: UserSession | null
  setSession: (s: UserSession | null) => void
  signOut: () => void
}

const UserContext = createContext<UserContextValue | null>(null)

const STORAGE_KEY = 'gns26_session'

function normalizeStoredSession(raw: UserSession | null): UserSession | null {
  if (!raw) return null
  if (typeof raw.isAdmin === 'boolean') return raw
  return { ...raw, isAdmin: parseIsAdminFromProfile(raw.profile) }
}

export function UserProvider({ children }: { children: ReactNode }) {
  /** Must start null on server + first client paint — reading localStorage in useState breaks hydration. */
  const [session, setSessionState] = useState<UserSession | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      setSessionState(normalizeStoredSession(JSON.parse(raw) as UserSession))
    } catch {
      // ignore corrupt storage
    }
  }, [])

  const setSession = useCallback((s: UserSession | null) => {
    const next = s
      ? { ...s, isAdmin: typeof s.isAdmin === 'boolean' ? s.isAdmin : parseIsAdminFromProfile(s.profile) }
      : null
    setSessionState(next)
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    else localStorage.removeItem(STORAGE_KEY)
  }, [])

  const signOut = useCallback(() => setSession(null), [setSession])

  const value = useMemo(
    () => ({
      session,
      setSession,
      signOut,
    }),
    [session, setSession, signOut]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
