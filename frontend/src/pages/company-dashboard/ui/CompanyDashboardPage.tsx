import { useAuth } from "@processes/auth/model/useAuth"
import { Link } from "react-router-dom"

import { Button } from "@shared/ui"

export function CompanyDashboardPage() {
  const { session, logout } = useAuth()
  const companyName =
    session && session.user.kind === "company" ? session.user.companyName : ""

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm">
          <div className="text-sm font-bold tracking-widest text-slate-500">
            DASHBOARD EMPRESARIAL
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Bienvenido{companyName ? `, ${companyName}` : ""}
          </h1>
          <p className="text-sm font-semibold text-slate-600">
            Este panel es placeholder para validar el flujo protegido.
          </p>

          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/login/company">
              <Button variant="primary" onClick={logout}>
                Cerrar sesión
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary">Ir a selección</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
