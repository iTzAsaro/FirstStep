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

type ActivityItem = {
  text: string;
  time: string;
  tone: "blue" | "emerald" | "purple" | "slate";
  icon: ReactNode;
};

function prettifyNameFromEmail(email: string | null | undefined) {
  const local = (email ?? "").split("@")[0] ?? "";
  const cleaned = local.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

const usdFormatterEs = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function timeAgo(iso: string) {
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
}

function formatSalary(min: number | null, max: number | null) {
  if (min === null && max === null) return "Compensación a convenir";
  const format = (value: number) => usdFormatterEs.format(value);
  if (min !== null && max !== null) return `${format(min)} - ${format(max)}`;
  if (min !== null) return `Desde ${format(min)}`;
  return `Hasta ${format(max as number)}`;
}

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
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [applyModal, setApplyModal] = useState<null | { jobId: number; title: string; companyName: string | null }>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem("firststep.api.accessToken") ?? "";
    if (!token) {
      setIsLoading(false);
      setLoadError("No hay sesión válida. Vuelve a iniciar sesión.");
      return;
    }

    const loadDashboard = async () => {
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
    };

    const loadJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError(null);
        const res = await fetch("/api/talent/jobs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          let message = `No se pudieron cargar las ofertas (${res.status}).`;
          try {
            const out = (await res.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }
        const out = (await res.json()) as { jobs: any[] };
        if (!alive) return;
        setJobs(out.jobs ?? []);
      } catch (e) {
        if (!alive) return;
        setJobsError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setJobsLoading(false);
      }
    };

    (async () => {
      await Promise.all([loadDashboard(), loadJobs()]);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const recentCvs = (data?.recent?.cvs ?? []) as Array<{ id: string; title: string; updatedAt: string }>;
  const recentSessions = (data?.recent?.sessions ?? []) as Array<{ id: string; kind: string; title: string; model: string; updatedAt: string }>;
  const jobRows = (jobs ?? []) as Array<{
    id: number;
    title: string;
    description: string;
    location: string | null;
    employmentType: string;
    seniority: string;
    salaryMin: number | null;
    salaryMax: number | null;
    companyName: string | null;
    createdAt: string;
    hasApplied: boolean;
  }>;

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

  const fullName =
    (typeof data?.profile?.fullName === "string" && data.profile.fullName.trim()) ||
    prettifyNameFromEmail(typeof data?.user?.email === "string" ? data.user.email : null) ||
    session.userName ||
    "Tu perfil";
  const topInterests = Array.isArray(data?.profile?.careerInterests)
    ? (data.profile.careerInterests as string[]).slice(0, 4)
    : [];
  const availableJobsCount = jobRows.filter((job) => !job.hasApplied).length;
  const hasLocation = hasText(data?.profile?.location);
  const hasEducation = hasText(data?.profile?.university) || hasText(data?.profile?.degree);
  const hasInterests = topInterests.length > 0;
  const quickStartItems = [
    {
      title: "Completa tu perfil",
      description: hasLocation && hasEducation && hasInterests
        ? "Tu perfil ya comunica una base sólida para reclutadores."
        : "Agrega ubicación, formación e intereses para mejorar tus recomendaciones.",
      action: "Ir al perfil",
      onClick: () => navigate(routes.onboarding),
      state: hasLocation && hasEducation && hasInterests ? "Listo" : "Recomendado",
    },
    {
      title: "Crea tu CV con IA",
      description: recentCvs.length > 0
        ? "Retoma tu currículum y ajústalo para tu próxima aplicación."
        : "Convierte tu experiencia en un CV más claro, fuerte y listo para enviar.",
      action: recentCvs.length > 0 ? "Continuar CV" : "Crear CV",
      onClick: () => navigate(routes.cvBuilder),
      state: recentCvs.length > 0 ? "En progreso" : "Prioridad",
    },
    {
      title: "Practica entrevistas",
      description: recentSessions.some((sessionItem) => sessionItem.kind === "interview")
        ? "Sigue afinando tus respuestas con nuevas simulaciones."
        : "Ensaya respuestas, gana confianza y llega mejor preparado a tus entrevistas.",
      action: "Empezar práctica",
      onClick: () => navigate(routes.interview),
      state: recentSessions.some((sessionItem) => sessionItem.kind === "interview") ? "Activo" : "Nuevo",
    },
  ];
  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_24%,#f8fafc_100%)]">
      {applyModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => {
              setApplyModal(null);
              setCoverLetter("");
              setApplyError(null);
            }}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#111827] truncate">Postular</p>
                <p className="text-[12px] text-slate-500 truncate">
                  {applyModal.title}
                  {applyModal.companyName ? ` · ${applyModal.companyName}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setApplyModal(null);
                  setCoverLetter("");
                  setApplyError(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              {applyError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {applyError}
                </div>
              ) : null}
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                Mensaje (opcional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                disabled={applyLoading}
                className="w-full min-h-28 bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm resize-y border border-transparent"
                placeholder="Cuéntales por qué eres buen candidato."
              />
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={applyLoading}
                onClick={() => {
                  setApplyModal(null);
                  setCoverLetter("");
                  setApplyError(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={applyLoading}
                onClick={async () => {
                  const token = localStorage.getItem("firststep.api.accessToken") ?? "";
                  if (!token) {
                    setApplyError("No hay sesión válida. Vuelve a iniciar sesión.");
                    return;
                  }
                  setApplyLoading(true);
                  setApplyError(null);
                  try {
                    const res = await fetch(`/api/talent/jobs/${applyModal.jobId}/apply`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({ coverLetter: coverLetter.trim() ? coverLetter.trim() : null }),
                    });
                    if (!res.ok) {
                      let message = `No se pudo postular (${res.status}).`;
                      try {
                        const out = (await res.json()) as any;
                        if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
                      } catch { }
                      throw new Error(message);
                    }
                    const jobsRes = await fetch("/api/talent/jobs", { headers: { Authorization: `Bearer ${token}` } });
                    if (jobsRes.ok) {
                      const out = (await jobsRes.json()) as any;
                      setJobs(out.jobs ?? []);
                    }
                    setApplyModal(null);
                    setCoverLetter("");
                  } catch (e) {
                    setApplyError(e instanceof Error ? e.message : String(e));
                  } finally {
                    setApplyLoading(false);
                  }
                }}
              >
                {applyLoading ? "Enviando..." : "Postular"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
              {[
                { label: "Resumen", path: routes.dashboard },
                { label: "Oportunidades", path: routes.opportunities },
                { label: "IA", path: routes.chat },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    item.path === routes.dashboard ? "bg-white text-[#1e3456] shadow-sm" : "text-slate-500 hover:text-[#1e3456]",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(routes.cvBuilder)}
              className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1e3456] shadow-sm transition-colors hover:border-[#294266] hover:text-[#294266]"
            >
              Mejorar CV
            </button>
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
        {isLoading ? (
          <div className="mb-8 rounded-3xl border border-white/80 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Cargando dashboard...
          </div>
        ) : loadError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            {loadError}
          </div>
        ) : null}

        <section className="mb-8 overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,#18314f_0%,#294266_42%,#5d85c4_100%)] px-6 py-7 text-white shadow-[0_24px_80px_-30px_rgba(30,52,86,0.45)] sm:px-8 sm:py-8">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_360px]">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">
                Primer acceso
              </span>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                Bienvenido a FirsTep, {fullName}.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100/90 sm:text-base">
                Este panel reúne lo más importante para tu primer impulso: completar tu propuesta profesional, crear un CV convincente y empezar a descubrir oportunidades alineadas contigo.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {topInterests.length > 0 ? topInterests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/95"
                  >
                    {interest}
                  </span>
                )) : (
                  <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/95">
                    Completa tus intereses para personalizar recomendaciones
                  </span>
                )}
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  type="button"
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1e3456] hover:bg-blue-50"
                  onClick={() => navigate(routes.onboarding)}
                >
                  Completar mi perfil
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
                  onClick={() => navigate(routes.cvBuilder)}
                >
                  Crear CV con IA
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/15"
                  onClick={() => navigate(routes.interview)}
                >
                  Practicar entrevista
                </Button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-100">Lo más útil ahora</p>
                  <p className="mt-2 text-2xl font-bold text-white">Tu siguiente mejor movimiento</p>
                </div>
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                  {availableJobsCount} vacantes nuevas
                </span>
              </div>

              <div className="mt-6 space-y-3">
                {quickStartItems.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={item.onClick}
                    className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/10 p-4 text-left transition-colors hover:bg-white/10"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-blue-100/90">{item.description}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-flex rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                        {item.state}
                      </span>
                      <p className="mt-3 text-xs font-bold text-white">{item.action}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.7fr)_360px]">
          <div className="space-y-8">
            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Oportunidades para ti</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3456]">
                    Vacantes que encajan con tu momento profesional
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-4 py-2 text-xs font-semibold text-[#294266]">
                    {jobRows.length} activas
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(routes.opportunities)}
                    className="text-xs font-semibold text-[#294266] hover:underline"
                  >
                    Ver todas
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50/50">
                {jobsLoading ? (
                  <div className="p-6">
                    <p className="text-sm text-slate-500">Cargando ofertas...</p>
                  </div>
                ) : jobsError ? (
                  <div className="p-6">
                    <p className="text-sm text-red-700">{jobsError}</p>
                  </div>
                ) : jobRows.length === 0 ? (
                  <div className="p-6">
                    <p className="text-sm text-slate-500">Aún no hay ofertas activas.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {jobRows.slice(0, 6).map((j) => (
                      <div key={j.id} className="px-5 py-5 sm:px-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-bold text-[#1e3456]">{j.title}</p>
                              {j.hasApplied ? (
                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                  Postulado
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-[12px] text-slate-400">
                              {(j.companyName ?? "Empresa")}
                              {j.location ? ` · ${j.location}` : ""}
                              {` · ${j.seniority}`}
                              {` · ${j.employmentType}`}
                            </p>
                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                              {j.description}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1.5 text-xs font-semibold text-[#294266]">
                                {formatSalary(j.salaryMin, j.salaryMax)}
                              </span>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                                Publicado {timeAgo(j.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant={j.hasApplied ? "secondary" : "primary"}
                              className="rounded-full px-5"
                              disabled={j.hasApplied}
                              onClick={() => {
                                setApplyError(null);
                                setCoverLetter("");
                                setApplyModal({ jobId: j.id, title: j.title, companyName: j.companyName });
                              }}
                            >
                              {j.hasApplied ? "Aplicación enviada" : "Quiero aplicar"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Impulso con IA</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1e3456]">
                      Sesiones recientes
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#294266] hover:underline"
                    onClick={() => navigate(routes.chat)}
                  >
                    Abrir chat
                  </button>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50/40">
                  {recentSessions.length === 0 ? (
                    <div className="p-6">
                      <p className="text-sm text-slate-500">
                        Aún no tienes sesiones. Ve a Chat o Simulación de entrevistas para crear una.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentSessions.map((s) => (
                        <div key={s.id} className="px-5 py-4 sm:px-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1e3456]">{s.title}</p>
                              <p className="mt-1 text-[11px] text-slate-400">
                                {s.kind === "interview" ? "Entrevista" : "Chat"} · {s.model}
                              </p>
                            </div>
                            <span className="whitespace-nowrap text-[11px] text-slate-400">
                              {timeAgo(s.updatedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Tus documentos</p>
                    <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1e3456]">
                      CVs recientes
                    </h2>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#294266] hover:underline"
                    onClick={() => navigate(routes.cvBuilder)}
                  >
                    Ir al CV
                  </button>
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50/40">
                  {recentCvs.length === 0 ? (
                    <div className="p-6">
                      <p className="text-sm text-slate-500">Aún no tienes CVs. Crea uno para empezar.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {recentCvs.map((cv) => (
                        <div key={cv.id} className="px-5 py-4 sm:px-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#1e3456]">{cv.title}</p>
                              <p className="mt-1 text-[11px] text-slate-400">Actualizado {timeAgo(cv.updatedAt)}</p>
                            </div>
                            <button
                              type="button"
                              className="whitespace-nowrap text-xs font-bold text-[#294266] transition-colors hover:text-blue-800"
                              onClick={() => navigate(routes.cvBuilder)}
                            >
                              Continuar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
              <div className="mb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Radar profesional</p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1e3456]">
                  Actividad reciente
                </h2>
              </div>

              <div className="space-y-5">
                {activity.length === 0 ? (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-5 text-sm text-slate-500">
                    Cuando empieces a crear CVs, usar IA o actualizar tu perfil, verás aquí tus avances.
                  </div>
                ) : (
                  activity.map((a, idx) => (
                    <div key={`${a.text}-${idx}`} className="flex gap-4">
                      <div
                        className={[
                          "mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl shrink-0",
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
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-6 text-[#1e3456]">{a.text}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{a.time}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-[#dbe7f8] bg-[linear-gradient(180deg,#f7faff,#ffffff)] p-6 shadow-sm sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Próximo movimiento</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3456]">
                Haz que tu perfil se vuelva más visible y más convincente.
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-500">
                Usa el constructor de CV, practica entrevistas y fortalece tu historia profesional para aumentar tus posibilidades de respuesta.
              </p>

              <div className="mt-6 space-y-3">
                {[
                  { label: "Perfeccionar CV con IA", action: () => navigate(routes.cvBuilder) },
                  { label: "Entrenar entrevista", action: () => navigate(routes.interview) },
                  { label: "Actualizar perfil", action: () => navigate(routes.onboarding) },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.action}
                    className="flex w-full items-center justify-between rounded-2xl border border-white bg-white/90 px-4 py-3 text-left shadow-sm transition-colors hover:border-[#294266]/20"
                  >
                    <span className="text-sm font-semibold text-[#1e3456]">{item.label}</span>
                    <span className="text-[#294266]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>
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
