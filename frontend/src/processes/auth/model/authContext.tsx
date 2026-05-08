import { createContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

import type { Session } from "./authTypes"

type AuthContextValue = {
  session: Session | null
  setSession: (session: Session | null) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null)

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      setSession,
      logout: () => setSession(null)
    }
  }, [session])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
