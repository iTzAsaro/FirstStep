import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

import { useAuth } from "../model/useAuth"

type RequireCompanyAuthProps = {
  children: ReactNode
}

export function RequireCompanyAuth({ children }: RequireCompanyAuthProps) {
  const { session } = useAuth()

  if (!session || session.user.kind !== "company") {
    return <Navigate to="/login/company" replace />
  }

  return children
}
