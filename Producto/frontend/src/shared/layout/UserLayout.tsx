// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     UserLayout.tsx                                           ║
// ║ Módulo:      frontend/src/shared/layout/UserLayout                    ║
// ║ Descripción: Layout compartido para todas las páginas del usuario     ║
// ║              con barra de navegación.                                 ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { ReactNode } from "react";

import { useLocation, useNavigate } from "react-router-dom";

import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";

const FEATURE_CV_BUILDER = import.meta.env.VITE_FEATURE_CV_BUILDER !== "false";
const FEATURE_AI_CHAT = import.meta.env.VITE_FEATURE_AI_CHAT !== "false";

type UserLayoutProps = {
  children: ReactNode;
};

export function UserLayout({ children }: UserLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  const navItems = [
    { label: "Resumen", path: routes.dashboard },
    { label: "Oportunidades", path: routes.opportunities },
    { label: "Empresas", path: routes.companies },
    { label: "Mensajes", path: routes.messages },
    ...(FEATURE_AI_CHAT ? [{ label: "Chat IA", path: routes.chat }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_24%,#f8fafc_100%)]">
      <nav className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-8">
            <button
              type="button"
              onClick={() => navigate(routes.dashboard)}
              className="flex items-center gap-3"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1e3456,#5d85c4)] text-sm font-bold text-white shadow-lg shadow-[#294266]/20">
                FT
              </span>
              <span className="hidden sm:block">
                <span className="block text-lg font-bold tracking-tight text-[#1e3456]">FirsTep</span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Career Momentum
                </span>
              </span>
            </button>

            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-white text-[#1e3456] shadow-sm"
                      : "text-slate-500 hover:text-[#1e3456]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {FEATURE_CV_BUILDER && (
              <button
                type="button"
                onClick={() => navigate(routes.cvBuilder)}
                className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1e3456] shadow-sm transition-colors hover:border-[#294266] hover:text-[#294266]"
              >
                Mejorar CV
              </button>
            )}
            <button
              type="button"
              onClick={logout}
              className="inline-flex rounded-full bg-[#1e3456] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#294266]/15 transition-colors hover:bg-[#15263d]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8 sm:px-6 lg:py-10">
        {children}
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-[#f8fafc]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
          <div>
            <span className="mb-1 block text-lg font-bold tracking-tight text-[#1e3456]">FirsTep</span>
            <p className="text-[11px] text-slate-400">
              © 2024 FirsTep Technologies. Impulsando carreras con IA y mejor contexto profesional.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
            <button type="button" className="hover:text-[#1e3456] transition-colors">
              Política de Privacidad
            </button>
            <button type="button" className="hover:text-[#1e3456] transition-colors">
              Términos de Servicio
            </button>
            <button type="button" className="hover:text-[#1e3456] transition-colors">
              Config. de Cookies
            </button>
            <button type="button" className="hover:text-[#1e3456] transition-colors">
              Soporte
            </button>
            <button type="button" className="hover:text-[#1e3456] transition-colors">
              Sobre Nosotros
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
