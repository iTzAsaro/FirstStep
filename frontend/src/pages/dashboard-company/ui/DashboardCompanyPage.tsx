import { Link } from "react-router-dom";

import { useSession } from "@/entities/session";
import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui";

export function DashboardCompanyPage() {
  const session = useSession();
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="border-b border-white/10 bg-black/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={routes.home} className="font-bold tracking-tight">
            FirsTep
          </Link>
          <div className="flex items-center gap-3">
            <Link to={routes.companySignUp} className="text-xs text-white/70 hover:text-white">
              Registro empresa
            </Link>
            <Button variant="secondary" size="sm" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-[2rem] bg-white/5 border border-white/10 p-10 md:p-12">
          <p className="text-[11px] font-bold tracking-widest uppercase text-white/60">Empresa</p>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            Bienvenido{session.companyName ? `, ${session.companyName}` : ""}
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl leading-relaxed">
            Este es un dashboard mock de empresa para que el flujo de login/registro sea completo desde el
            landing. Aquí puedes conectar las futuras secciones (vacantes, candidatos, entrevistas, etc.).
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link to={routes.portal} className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10">
                Ir al portal
              </Button>
            </Link>
            <Link to={routes.home} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
