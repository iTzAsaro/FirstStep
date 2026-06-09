import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui";

type JobRow = {
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
};

function formatSalary(min: number | null, max: number | null) {
  if (min === null && max === null) return "Compensación a convenir";
  const format = (value: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  if (min !== null && max !== null) return `${format(min)} - ${format(max)}`;
  if (min !== null) return `Desde ${format(min)}`;
  return `Hasta ${format(max as number)}`;
}

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

export function OpportunitiesUserPage() {
  const navigate = useNavigate();
  const logout = useLogout();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "applied">("all");
  const [employmentFilter, setEmploymentFilter] = useState<"all" | string>("all");

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

    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [dashboardRes, jobsRes] = await Promise.all([
          fetch("/api/talent/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/talent/jobs", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!dashboardRes.ok) {
          let message = `No se pudo cargar tu contexto (${dashboardRes.status}).`;
          try {
            const out = (await dashboardRes.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }

        if (!jobsRes.ok) {
          let message = `No se pudieron cargar las oportunidades (${jobsRes.status}).`;
          try {
            const out = (await jobsRes.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }

        const dashboardOut = await dashboardRes.json();
        const jobsOut = (await jobsRes.json()) as { jobs?: JobRow[] };

        if (!alive) return;
        setData(dashboardOut);
        setJobs(Array.isArray(jobsOut.jobs) ? jobsOut.jobs : []);
      } catch (error) {
        if (!alive) return;
        setLoadError(error instanceof Error ? error.message : String(error));
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const interests = Array.isArray(data?.profile?.careerInterests) ? (data.profile.careerInterests as string[]).slice(0, 4) : [];

  const employmentOptions = useMemo(() => {
    const values = Array.from(new Set(jobs.map((job) => job.employmentType).filter(Boolean)));
    return values;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (statusFilter === "applied" && !job.hasApplied) return false;
      if (statusFilter === "new" && job.hasApplied) return false;
      if (employmentFilter !== "all" && job.employmentType !== employmentFilter) return false;
      if (!query) return true;
      const haystack = [
        job.title,
        job.companyName ?? "",
        job.location ?? "",
        job.seniority,
        job.description,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [employmentFilter, jobs, search, statusFilter]);

  const appliedCount = jobs.filter((job) => job.hasApplied).length;
  const availableCount = jobs.filter((job) => !job.hasApplied).length;

  async function refreshJobs() {
    const token = localStorage.getItem("firststep.api.accessToken") ?? "";
    if (!token) return;
    const res = await fetch("/api/talent/jobs", { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const out = (await res.json()) as { jobs?: JobRow[] };
    setJobs(Array.isArray(out.jobs) ? out.jobs : []);
  }

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
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[#111827]">Postular a oportunidad</p>
                <p className="truncate text-[12px] text-slate-500">
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
                className="p-1 text-slate-400 transition-colors hover:text-slate-600"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 px-5 py-4">
              {applyError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {applyError}
                </div>
              ) : null}
              <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Mensaje para la empresa (opcional)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                disabled={applyLoading}
                className="min-h-28 w-full resize-y rounded-xl border border-transparent bg-[#f3f5f8] px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#294266]/20"
                placeholder="Cuéntales por qué encajas bien con esta oportunidad."
              />
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
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
                    await refreshJobs();
                    setApplyModal(null);
                    setCoverLetter("");
                  } catch (error) {
                    setApplyError(error instanceof Error ? error.message : String(error));
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
            <button type="button" onClick={() => navigate(routes.dashboard)} className="flex items-center gap-3">
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
                    item.path === routes.opportunities ? "bg-white text-[#1e3456] shadow-sm" : "text-slate-500 hover:text-[#1e3456]",
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
            Cargando oportunidades...
          </div>
        ) : loadError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            {loadError}
          </div>
        ) : null}

        <section className="mb-8 rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <span className="inline-flex rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">
                Oportunidades activas
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1e3456] sm:text-4xl">
                Explora vacantes y postúlate con claridad.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
                Revisa oportunidades alineadas con tu perfil, filtra lo más relevante y enfócate en las posiciones con mejor potencial para ti.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Disponibles</p>
                <p className="mt-1 text-lg font-bold text-[#1e3456]">{availableCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Postuladas</p>
                <p className="mt-1 text-lg font-bold text-[#1e3456]">{appliedCount}</p>
              </div>
            </div>
          </div>

          {interests.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2.5">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.7fr)_340px]">
          <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Explora vacantes</p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3456]">
                    Oportunidades abiertas para talento
                  </h2>
                </div>
                <span className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-4 py-2 text-xs font-semibold text-[#294266]">
                  {filteredJobs.length} resultados
                </span>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por cargo, empresa, ciudad o seniority"
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 py-2">
                  {[
                    { label: "Todas", value: "all" },
                    { label: "Nuevas", value: "new" },
                    { label: "Postuladas", value: "applied" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStatusFilter(item.value as "all" | "new" | "applied")}
                      className={[
                        "whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                        statusFilter === item.value ? "bg-[#1e3456] text-white" : "text-slate-500 hover:text-[#1e3456]",
                      ].join(" ")}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <select
                  value={employmentFilter}
                  onChange={(e) => setEmploymentFilter(e.target.value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
                >
                  <option value="all">Todo tipo</option>
                  {employmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50/50">
              {filteredJobs.length === 0 ? (
                <div className="p-6">
                  <p className="text-sm text-slate-500">
                    No encontramos oportunidades con esos filtros. Ajusta la búsqueda o revisa nuevamente más tarde.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredJobs.map((job) => (
                    <article key={job.id} className="px-5 py-5 sm:px-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold text-[#1e3456]">{job.title}</h3>
                            {job.hasApplied ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                                Ya postulaste
                              </span>
                            ) : (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#294266]">
                                Nueva oportunidad
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-[12px] text-slate-400">
                            {(job.companyName ?? "Empresa")}
                            {job.location ? ` · ${job.location}` : ""}
                            {` · ${job.seniority}`}
                            {` · ${job.employmentType}`}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-slate-600">{job.description}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1.5 text-xs font-semibold text-[#294266]">
                              {formatSalary(job.salaryMin, job.salaryMax)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                              Publicado {timeAgo(job.createdAt)}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 xl:w-[180px]">
                          <Button
                            type="button"
                            size="sm"
                            variant={job.hasApplied ? "secondary" : "primary"}
                            className="w-full rounded-full px-5"
                            disabled={job.hasApplied}
                            onClick={() => {
                              setApplyError(null);
                              setCoverLetter("");
                              setApplyModal({ jobId: job.id, title: job.title, companyName: job.companyName });
                            }}
                          >
                            {job.hasApplied ? "Aplicación enviada" : "Postular ahora"}
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-8">
            <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Cómo destacar</p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1e3456]">
                Antes de postular
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  "Ten listo un CV actualizado y bien enfocado al rol.",
                  "Usa un mensaje breve y específico si decides agregar presentación.",
                  "Practica entrevista para responder con más claridad y seguridad.",
                ].map((tip) => (
                  <div key={tip} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
                    {tip}
                  </div>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-[2rem] border border-[#dbe7f8] bg-[linear-gradient(180deg,#f7faff,#ffffff)] p-6 shadow-sm sm:p-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Accesos rápidos</p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3456]">
                Refuerza tu candidatura antes de aplicar.
              </h3>
              <div className="mt-6 space-y-3">
                {[
                  { label: "Crear o mejorar CV", action: () => navigate(routes.cvBuilder) },
                  { label: "Practicar entrevista", action: () => navigate(routes.interview) },
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
    </div>
  );
}
