import type { ReactNode } from "react";
import { useMemo } from "react";

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

type TalentCard = {
  name: string;
  role: string;
  match: string;
  tag: string;
  avatarUrl: string;
  description: string;
};

type JobRow = {
  role: string;
  published: string;
  status: "Activo" | "Pausado";
  applicants: number;
  action: string;
};

type ActivityItem = {
  text: string;
  time: string;
  tone: "blue" | "emerald" | "purple" | "slate";
  icon: ReactNode;
};

export function DashboardUserPage() {
  const session = useSession();
  const navigate = useNavigate();
  const logout = useLogout();

  const name = session.userName ?? "Alex";

  const stats: StatCard[] = useMemo(
    () => [
      {
        title: "Trabajos Activos",
        value: "08",
        badge: { text: "+2 este mes", tone: "success" },
      },
      {
        title: "Aplicaciones Totales",
        value: "342",
      },
      {
        title: "Entrevistas Pendientes",
        value: "14",
      },
      {
        title: "Prom. Match con IA",
        value: "92%",
        highlight: true,
      },
    ],
    [],
  );

  const talent: TalentCard[] = useMemo(
    () => [
      {
        name: "Sarah Jenkins",
        role: "Diseñadora de Producto Senior",
        match: "98% MATCH",
        tag: "Experta en Figma",
        avatarUrl: "https://i.pravatar.cc/150?img=44",
        description:
          "8+ años de experiencia en empresas SaaS de primer nivel. Experta en sistemas de diseño y flujos centrados en el usuario...",
      },
      {
        name: "Marcus Thorne",
        role: "Ingeniero Backend Lead",
        match: "95% MATCH",
        tag: "Node.js",
        avatarUrl: "https://i.pravatar.cc/150?img=12",
        description:
          "Especializado en infraestructura de alta escala y microservicios. Previamente lideró el departamento de ingeniería en...",
      },
    ],
    [],
  );

  const jobs: JobRow[] = useMemo(
    () => [
      {
        role: "Diseñador UX Senior",
        published: "Publicado hace 3 días",
        status: "Activo",
        applicants: 48,
        action: "Gestionar",
      },
      {
        role: "Director de Marketing",
        published: "Publicado hace 1 semana",
        status: "Activo",
        applicants: 112,
        action: "Gestionar",
      },
      {
        role: "Ingeniero DevOps Lead",
        published: "Borrador",
        status: "Pausado",
        applicants: 0,
        action: "Reanudar",
      },
    ],
    [],
  );

  const activity: ActivityItem[] = useMemo(
    () => [
      {
        text: "Nueva aplicación para Diseñador UX Junior",
        time: "Hace 2 minutos",
        tone: "blue",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        ),
      },
      {
        text: "Entrevista programada con David Chen",
        time: "Hace 1 hora",
        tone: "emerald",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ),
      },
      {
        text: "Nuevo talento de alto match identificado por IA",
        time: "Hace 3 horas",
        tone: "purple",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
      },
      {
        text: "Mensaje recibido de Elena Rodriguez",
        time: "Ayer",
        tone: "slate",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        ),
      },
    ],
    [],
  );

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1e3456] mb-2 tracking-tight">
              Bienvenido de nuevo, {name}.
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              Tienes 12 nuevas aplicaciones para tus roles activos hoy.
            </p>
          </div>
          <Button type="button" className="px-5 py-2.5 rounded-lg font-medium text-sm">
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
            Publicar Nuevo Trabajo
          </Button>
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
                  Mejores Recomendaciones de Talento
                </h2>
                <button type="button" className="text-xs font-semibold text-[#294266] hover:underline">
                  Ver Todos los Matches
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {talent.map((t) => (
                  <div
                    key={t.name}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={t.avatarUrl}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100"
                      />
                      <div>
                        <h3 className="font-bold text-[#1e3456] text-lg">{t.name}</h3>
                        <p className="text-xs text-slate-500 mb-2">{t.role}</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-blue-50 text-[#294266] text-[9px] font-bold tracking-wider px-2 py-1 rounded-md">
                            {t.match}
                          </span>
                          <span className="bg-slate-100 text-slate-600 text-[9px] font-bold tracking-wider px-2 py-1 rounded-md uppercase">
                            {t.tag}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6 flex-1">{t.description}</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="flex-1 bg-[#294266] text-white py-2.5 rounded-lg text-xs font-semibold hover:bg-[#1a2b44] transition-colors"
                      >
                        Invitar a Aplicar
                      </button>
                      <button
                        type="button"
                        className="p-2.5 border border-slate-200 rounded-lg text-slate-400 hover:text-[#294266] hover:border-[#294266] transition-colors"
                      >
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
                        >
                          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#1e3456] tracking-tight">
                  Ofertas de Trabajo Activas
                </h2>
                <button type="button" className="text-slate-400 hover:text-[#294266] transition-colors">
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
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                        <th className="py-4 px-6 font-bold">Nombre del Rol</th>
                        <th className="py-4 px-6 font-bold">Estado</th>
                        <th className="py-4 px-6 font-bold">Aplicantes</th>
                        <th className="py-4 px-6 font-bold text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((j) => (
                        <tr
                          key={j.role}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors last:border-b-0"
                        >
                          <td className="py-4 px-6">
                            <p className="text-sm font-semibold text-[#1e3456]">{j.role}</p>
                            <p className="text-[11px] text-slate-400 mt-1">{j.published}</p>
                          </td>
                          <td className="py-4 px-6">
                            {j.status === "Activo" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Pausado
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-sm text-slate-600">
                            <span className={j.status === "Activo" ? "font-bold text-[#1e3456]" : "font-bold text-slate-400"}>
                              {String(j.applicants).padStart(2, "0")}
                            </span>{" "}
                            aplicantes
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button type="button" className="text-xs font-bold text-[#294266] hover:text-blue-800 transition-colors">
                              {j.action}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
