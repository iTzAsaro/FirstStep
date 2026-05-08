import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

import { useAuth } from "../model/useAuth"

type RequireUserAuthProps = {
  children: ReactNode
}

export function RequireUserAuth({ children }: RequireUserAuthProps) {
  const { session } = useAuth()

  if (!session || session.user.kind !== "user") {
    return <Navigate to="/login/user/sign-in" replace />
  }

  return children
}

