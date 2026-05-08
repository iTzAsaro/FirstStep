import { Link } from "react-router-dom"

import { Button } from "@shared/ui"

export function LoginSelectionPage() {
  return (
    <div className="min-h-screen bg-[#264572] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 p-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3">
            <span className="text-2xl font-extrabold tracking-tight">FirsTep</span>
            <span className="rounded-full bg-[#D5E3FF]/20 px-3 py-1 text-xs font-extrabold tracking-widest text-[#D5E3FF]">
              AUTH
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Selecciona tu tipo de acceso
          </h1>
          <p className="max-w-2xl text-white/80">
            Esta base prepara dos flujos de autenticación: empresas (activo) y
            usuarios normales (próximo).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-6">
            <h2 className="text-xl font-extrabold">Empresas</h2>
            <p className="mt-2 text-sm font-semibold text-white/80">
              Login corporativo y recuperación de contraseña.
            </p>
            <div className="mt-5">
              <Link to="/login/company">
                <Button variant="primary">Ir a Login Empresas</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-extrabold">Usuarios</h2>
            <p className="mt-2 text-sm font-semibold text-white/70">
              Registro e inicio de sesión para usuarios normales.
            </p>
            <div className="mt-5">
              <Link to="/login/user">
                <Button variant="secondary">Ir a Login Usuarios</Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="text-sm font-semibold text-white/70">
          Sugerencia de mock auth: activa VITE_USE_MOCK_AUTH=true para probar con
          credenciales demo.
        </div>
      </div>
    </div>
  )
}
