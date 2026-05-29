// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     DashboardUserPage.tsx                                   ║
// ║ Módulo:      frontend/src/pages/dashboard-user/ui                    ║
// ║ Descripción: Dashboard mock del usuario con estadísticas y panel UI. ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui";

type StatCard = {
  title: string;
  value: string;
  badge?: { text: string; tone: "success" | "neutral" };
  highlight?: boolean;
};

type ActivityItem = {
  text: string;
  time: string;
  tone: "blue" | "emerald" | "purple" | "slate";
  icon: ReactNode;
};

/**
 * Renderiza el dashboard principal del usuario (talento) en modo mock.
 * La información presentada es estática y sirve como base visual del producto.
 */
export function DashboardUserPage() {
  const session = useSession();
  const navigate = useNavigate();
  const logout = useLogout();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem("firststep.api.accessToken") ?? "";
    if (!token) {
      setIsLoading(false);
      setLoadError("No hay sesión válida. Vuelve a iniciar sesión.");
      return;
    }

    (async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const res = await fetch("/api/talent/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          let message = `No se pudo cargar el dashboard (${res.status}).`;
          try {
            const out = (await res.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }
        const out = await res.json();
        if (!alive) return;
        setData(out);
      } catch (e) {
        if (!alive) return;
        setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setIsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const name = (data?.profile?.fullName as string | null) ?? session.userName ?? "Alex";

  const stats: StatCard[] = useMemo(() => {
    const cvsCount = Number(data?.stats?.cvsCount ?? 0);
    const aiSessionsCount = Number(data?.stats?.aiSessionsCount ?? 0);
    const interviewsCount = Number(data?.stats?.interviewsCount ?? 0);
    const profileCompleteness = Number(data?.stats?.profileCompleteness ?? 0);
    return [
      { title: "CVs Creados", value: String(cvsCount).padStart(2, "0") },
      { title: "Sesiones IA", value: String(aiSessionsCount) },
      { title: "Entrevistas IA", value: String(interviewsCount) },
      { title: "Perfil Completo", value: `${profileCompleteness}%`, highlight: true },
    ];
  }, [data]);

  const recentCvs = (data?.recent?.cvs ?? []) as Array<{ id: string; title: string; updatedAt: string }>;
  const recentSessions = (data?.recent?.sessions ?? []) as Array<{ id: string; kind: string; title: string; model: string; updatedAt: string }>;

  const timeAgo = (iso: string) => {
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return "Hace un momento";
    const diff = Date.now() - t;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Hace un momento";
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} d`;
  };

  const activity: ActivityItem[] = useMemo(() => {
    const raw = (data?.activity ?? []) as any[];
    if (!Array.isArray(raw) || raw.length === 0) return [];

    return raw.map((a) => {
      const source = String(a.source ?? "");
      const label = String(a.label ?? "");
      const at = String(a.at ?? "");
      const isCv = source === "cv";
      const isSession = source === "ai_session";
      const isProfile = source === "profile";
      const tone: ActivityItem["tone"] = isCv ? "blue" : isSession ? "purple" : "emerald";
      const icon = isCv ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ) : isSession ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      );
      const text = isProfile ? "Perfil actualizado" : isCv ? `CV: ${label}` : `Sesión IA: ${label}`;
      return { text, time: timeAgo(at), tone, icon } satisfies ActivityItem;
    });
  }, [data]);

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-[#f8fafc]">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button
              type="button"
              onClick={() => navigate(routes.dashboard)}
              className="font-bold text-[#1e3456] text-xl tracking-tight"
            >
              FirsTep
            </button>

            <div className="hidden md:flex items-center h-16 gap-8 text-sm font-medium">
              <button
                type="button"
                className="h-full flex items-center text-[#294266] border-b-2 border-[#294266]"
              >
                Panel
              </button>
              <button
                type="button"
                className="h-full flex items-center text-slate-500 hover:text-slate-800 transition-colors border-b-2 border-transparent"
              >
                Fondo de Talento
              </button>
              <button
                type="button"
                className="h-full flex items-center text-slate-500 hover:text-slate-800 transition-colors border-b-2 border-transparent"
              >
                Ofertas de Trabajo
              </button>
              <button
                type="button"
                className="h-full flex items-center text-slate-500 hover:text-slate-800 transition-colors border-b-2 border-transparent"
              >
                Análisis
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block relative w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Buscar talento..."
                className="w-full bg-[#f1f5f9] text-slate-700 rounded-full pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm border border-transparent"
              />
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <button type="button" className="hover:text-slate-600 transition-colors relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </button>
              <button type="button" className="hover:text-slate-600 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full border border-slate-200 overflow-hidden ml-2"
              >
                <img src="https://i.pravatar.cc/150?img=32" alt="" className="w-full h-full object-cover" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-6 py-8 w-full flex-1">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-sm text-slate-600 mb-8">
            Cargando dashboard...
          </div>
        ) : loadError ? (
          <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-200 text-sm text-red-700 mb-8">
            {loadError}
          </div>
        ) : null}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1e3456] mb-2 tracking-tight">
              Bienvenido de nuevo, {name}.
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              {data?.profile?.careerInterests?.length
                ? `Intereses: ${(data.profile.careerInterests as string[]).slice(0, 3).join(", ")}.`
                : "Completa tu perfil para mejorar tus recomendaciones."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="px-5 py-2.5 rounded-lg font-medium text-sm"
              onClick={() => navigate(routes.cvBuilder)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Currículum AI
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-5 py-2.5 rounded-lg font-medium text-sm"
              onClick={() => navigate(routes.chat)}
            >
              Chat
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-5 py-2.5 rounded-lg font-medium text-sm"
              onClick={() => navigate(routes.interview)}
            >
              Simulación de entrevistas
            </Button>
            <Button
              type="button"
              className="px-5 py-2.5 rounded-lg font-medium text-sm"
              onClick={() => navigate(routes.onboarding)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </svg>
              Actualizar Perfil
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((card) => {
            if (card.highlight) {
              return (
                <div
                  key={card.title}
                  className="bg-[#294266] rounded-2xl p-6 shadow-md shadow-[#294266]/20 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                  <h3 className="text-[10px] font-bold text-blue-200/80 tracking-widest uppercase mb-4 relative z-10">
                    {card.title}
                  </h3>
                  <div className="flex items-end justify-between relative z-10">
                    <span className="text-4xl font-bold text-white">{card.value}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-200/80"
                    >
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                      <path d="M5 3v4" />
                      <path d="M19 17v4" />
                      <path d="M3 5h4" />
                      <path d="M17 19h4" />
                    </svg>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={card.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between"
              >
                <h3 className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-4">
                  {card.title}
                </h3>
                <div className="flex items-end justify-between">
                  <span className="text-4xl font-bold text-[#1e3456]">{card.value}</span>
                  {card.badge ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                      {card.badge.text}
                    </span>
                  ) : null}
                  {!card.badge && card.title === "Aplicaciones Totales" ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-slate-300"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ) : null}
                  {!card.badge && card.title === "Entrevistas Pendientes" ? (
                    <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                      <div className="w-6 h-6 rounded-full bg-[#5d85c4] border-2 border-white" />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-10">
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#1e3456] tracking-tight">
                  Sesiones IA Recientes
                </h2>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#294266] hover:underline"
                  onClick={() => navigate(routes.chat)}
                >
                  Ir al chat
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {recentSessions.length === 0 ? (
                  <div className="p-6">
                    <p className="text-sm text-slate-500">
                      Aún no tienes sesiones. Ve a Chat o Simulación de entrevistas para crear una.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentSessions.map((s) => (
                      <div key={s.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1e3456] truncate">{s.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {s.kind === "interview" ? "Entrevista" : "Chat"} · {s.model}
                          </p>
                        </div>
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {timeAgo(s.updatedAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#1e3456] tracking-tight">
                  CVs Recientes
                </h2>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#294266] hover:underline"
                  onClick={() => navigate(routes.cvBuilder)}
                >
                  Ir al CV
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {recentCvs.length === 0 ? (
                  <div className="p-6">
                    <p className="text-sm text-slate-500">Aún no tienes CVs. Crea uno para empezar.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentCvs.map((cv) => (
                      <div key={cv.id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1e3456] truncate">{cv.title}</p>
                          <p className="text-[11px] text-slate-400 mt-1">Actualizado {timeAgo(cv.updatedAt)}</p>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-bold text-[#294266] hover:text-blue-800 transition-colors whitespace-nowrap"
                          onClick={() => navigate(routes.cvBuilder)}
                        >
                          Ver
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="xl:col-span-1">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 h-full flex flex-col">
              <div className="flex items-center justify-between gap-4 mb-8">
                <h2 className="text-lg font-bold text-[#1e3456]">Actividad Reciente</h2>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Cerrar sesión
                </button>
              </div>

              <div className="space-y-8 flex-1">
                {activity.map((a, idx) => (
                  <div key={`${a.text}-${idx}`} className="flex gap-4">
                    <div
                      className={[
                        "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                        a.tone === "blue"
                          ? "bg-blue-50 text-[#294266]"
                          : a.tone === "emerald"
                            ? "bg-emerald-50 text-emerald-600"
                            : a.tone === "purple"
                              ? "bg-purple-50 text-purple-500"
                              : "bg-slate-100 text-slate-500",
                      ].join(" ")}
                    >
                      {a.icon}
                    </div>
                    <div>
                      <p className="text-sm text-[#1e3456] font-medium leading-tight mb-1">{a.text}</p>
                      <p className="text-[10px] text-slate-400">{a.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#f0f4f8] rounded-xl p-5 mt-8 border border-blue-100/50">
                <h4 className="text-xs font-bold text-[#1e3456] mb-2">Consejo Pro</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                  Las empresas que responden en menos de 24 horas a los candidatos de alto match
                  tienen 4x más probabilidades de asegurar la contratación.
                </p>
                <button type="button" className="text-[11px] font-bold text-[#294266] hover:underline">
                  Aprender Más
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-[#f8fafc] mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-[#1e3456] text-lg tracking-tight block mb-1">FirsTep</span>
            <p className="text-[11px] text-slate-400">
              © 2024 FirsTep Technologies. Todos los derechos reservados.
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
