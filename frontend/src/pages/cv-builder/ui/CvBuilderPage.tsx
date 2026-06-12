// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     CvBuilderPage.tsx                                       ║
// ║ Módulo:      frontend/src/pages/cv-builder/ui                       ║
// ║ Descripción: Página del Constructor de CV AI (temporalmente en       ║
// ║              mantenimiento mientras se ajusta la infraestructura de  ║
// ║              IA local con Ollama).                                   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Link } from "react-router-dom";

import { routes } from "@/shared/config/routes";

/**
 * Vista de mantenimiento para el Constructor de CV AI.
 *
 * El asistente depende de un modelo local (Ollama) que actualmente está
 * en ajuste/optimización. Mientras tanto se muestra este aviso en vez del
 * chat, para no exponer una experiencia rota al usuario final.
 */
export function CvBuilderPage() {
  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f8fafc] text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            FT
          </div>
          <div>
            <span className="font-bold text-[#1e3456] text-base block leading-none">FirsTep AI</span>
            <span className="text-[9px] text-slate-400 font-bold tracking-widest block mt-0.5">CAREER CO-PILOT</span>
          </div>
        </div>
        <Link
          to={routes.dashboard}
          className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Volver al dashboard
        </Link>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white border border-slate-100 rounded-2xl shadow-[0_18px_60px_-30px_rgba(15,23,42,0.45)] p-8 text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            </svg>
          </div>

          <h1 className="text-lg font-bold text-[#1e3456] mb-2">Currículum AI en mantenimiento</h1>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Estamos ajustando nuestro asistente de IA para construir tu CV. Vuelve a intentarlo más tarde.
          </p>

          <Link
            to={routes.dashboard}
            className="inline-flex items-center justify-center gap-2 bg-[#294266] hover:bg-[#1a2b44] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Volver al dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
