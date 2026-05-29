// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     DashboardCompanyPage.tsx                                ║
// ║ Módulo:      frontend/src/pages/dashboard-company/ui                 ║
// ║ Descripción: Dashboard mock para empresas (flujo de acceso básico).  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui";

/**
 * Renderiza el dashboard de empresa para el flujo de demo/mock.
 * Muestra información básica de sesión y permite cerrar sesión.
 */
export function DashboardCompanyPage() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();

  type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
  type Seniority = "junior" | "mid" | "senior";
  type JobStatus = "active" | "paused";

  type JobRow = {
    id: number;
    title: string;
    description: string;
    location: string | null;
    employmentType: EmploymentType;
    seniority: Seniority;
    salaryMin: number | null;
    salaryMax: number | null;
    status: JobStatus;
    createdAt: string;
    updatedAt: string;
    applicantsCount: number;
  };

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modal, setModal] = useState<null | "create" | { editId: number }>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formEmploymentType, setFormEmploymentType] = useState<EmploymentType>("full_time");
  const [formSeniority, setFormSeniority] = useState<Seniority>("junior");
  const [formSalaryMin, setFormSalaryMin] = useState("");
  const [formSalaryMax, setFormSalaryMax] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const token = useMemo(() => localStorage.getItem("firststep.api.accessToken") ?? "", []);

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormLocation("");
    setFormEmploymentType("full_time");
    setFormSeniority("junior");
    setFormSalaryMin("");
    setFormSalaryMax("");
  };

  const openCreate = () => {
    resetForm();
    setModal("create");
  };

  const openEdit = (job: JobRow) => {
    setFormTitle(job.title);
    setFormDescription(job.description);
    setFormLocation(job.location ?? "");
    setFormEmploymentType(job.employmentType);
    setFormSeniority(job.seniority);
    setFormSalaryMin(job.salaryMin === null ? "" : String(job.salaryMin));
    setFormSalaryMax(job.salaryMax === null ? "" : String(job.salaryMax));
    setModal({ editId: job.id });
  };

  const loadJobs = async () => {
    if (!token) {
      setError("No hay sesión válida. Vuelve a iniciar sesión.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/company/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("firststep.api.accessToken");
          setError("Tu sesión no tiene permisos de empresa. Vuelve a iniciar sesión como empresa.");
          setIsLoading(false);
          return;
        }
        let message = `No se pudo cargar tus trabajos (${res.status}).`;
        try {
          const out = (await res.json()) as any;
          if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
        } catch { }
        throw new Error(message);
      }
      const out = (await res.json()) as { jobs: JobRow[] };
      setJobs(out.jobs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  const parseOptionalInt = (raw: string) => {
    const v = raw.trim();
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return { error: "Debe ser un número entero válido." as const };
    return n;
  };

  const formErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!formTitle.trim()) errs.title = "El título es requerido.";
    if (!formDescription.trim()) errs.description = "La descripción es requerida.";

    const min = parseOptionalInt(formSalaryMin);
    const max = parseOptionalInt(formSalaryMax);
    if (typeof min === "object" && min?.error) errs.salaryMin = min.error;
    if (typeof max === "object" && max?.error) errs.salaryMax = max.error;
    if (typeof min === "number" && typeof max === "number" && min > max) errs.salaryMax = "El máximo debe ser mayor o igual al mínimo.";
    return errs;
  }, [formDescription, formSalaryMax, formSalaryMin, formTitle]);

  const canSave = Object.keys(formErrors).length === 0 && !isSaving && Boolean(token);

  const submit = async () => {
    if (!canSave) return;
    setIsSaving(true);
    setError(null);
    try {
      const salaryMinParsed = parseOptionalInt(formSalaryMin);
      const salaryMaxParsed = parseOptionalInt(formSalaryMax);

      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        location: formLocation.trim() ? formLocation.trim() : null,
        employmentType: formEmploymentType,
        seniority: formSeniority,
        salaryMin: typeof salaryMinParsed === "number" ? salaryMinParsed : null,
        salaryMax: typeof salaryMaxParsed === "number" ? salaryMaxParsed : null,
      };

      const isEdit = typeof modal === "object" && modal !== null && "editId" in modal;
      const url = isEdit ? `/api/company/jobs/${modal.editId}` : "/api/company/jobs";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let message = `No se pudo guardar (${res.status}).`;
        try {
          const out = (await res.json()) as any;
          if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
        } catch { }
        throw new Error(message);
      }
      setModal(null);
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (job: JobRow) => {
    if (!token) return;
    const nextStatus: JobStatus = job.status === "active" ? "paused" : "active";
    try {
      const res = await fetch(`/api/company/jobs/${job.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        let message = `No se pudo actualizar (${res.status}).`;
        try {
          const out = (await res.json()) as any;
          if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
        } catch { }
        throw new Error(message);
      }
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const formatTime = (iso: string) => {
    const t = new Date(iso);
    if (!Number.isFinite(t.getTime())) return "";
    return t.toLocaleDateString();
  };

  return (
    <div className="min-h-screen text-slate-800 bg-[#f8fafc]">
      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/40" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">
                {typeof modal === "string" ? "Publicar nuevo trabajo" : "Editar trabajo"}
              </p>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Título
                </label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  disabled={isSaving}
                  className={[
                    "w-full bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm",
                    formErrors.title ? "ring-2 ring-red-200" : "border border-transparent",
                  ].join(" ")}
                  placeholder="Ej. Diseñador UX Junior"
                />
                {formErrors.title ? <p className="mt-2 text-[11px] text-red-700">{formErrors.title}</p> : null}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Descripción
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  disabled={isSaving}
                  className={[
                    "w-full min-h-32 bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm resize-y",
                    formErrors.description ? "ring-2 ring-red-200" : "border border-transparent",
                  ].join(" ")}
                  placeholder="Describe responsabilidades, requisitos y beneficios."
                />
                {formErrors.description ? <p className="mt-2 text-[11px] text-red-700">{formErrors.description}</p> : null}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Ubicación
                </label>
                <input
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  disabled={isSaving}
                  className="w-full bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm border border-transparent"
                  placeholder="Ej. Bogotá / Remoto"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Tipo de contrato
                </label>
                <select
                  value={formEmploymentType}
                  onChange={(e) => setFormEmploymentType(e.target.value as EmploymentType)}
                  disabled={isSaving}
                  className="w-full bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm border border-transparent"
                >
                  <option value="full_time">Tiempo completo</option>
                  <option value="part_time">Medio tiempo</option>
                  <option value="contract">Contrato</option>
                  <option value="internship">Prácticas</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Seniority
                </label>
                <select
                  value={formSeniority}
                  onChange={(e) => setFormSeniority(e.target.value as Seniority)}
                  disabled={isSaving}
                  className="w-full bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm border border-transparent"
                >
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Salario mínimo (opcional)
                </label>
                <input
                  value={formSalaryMin}
                  onChange={(e) => setFormSalaryMin(e.target.value)}
                  disabled={isSaving}
                  className={[
                    "w-full bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm",
                    formErrors.salaryMin ? "ring-2 ring-red-200" : "border border-transparent",
                  ].join(" ")}
                  placeholder="Ej. 2000"
                  inputMode="numeric"
                />
                {formErrors.salaryMin ? <p className="mt-2 text-[11px] text-red-700">{formErrors.salaryMin}</p> : null}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Salario máximo (opcional)
                </label>
                <input
                  value={formSalaryMax}
                  onChange={(e) => setFormSalaryMax(e.target.value)}
                  disabled={isSaving}
                  className={[
                    "w-full bg-[#f3f5f8] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 transition-all text-sm",
                    formErrors.salaryMax ? "ring-2 ring-red-200" : "border border-transparent",
                  ].join(" ")}
                  placeholder="Ej. 3500"
                  inputMode="numeric"
                />
                {formErrors.salaryMax ? <p className="mt-2 text-[11px] text-red-700">{formErrors.salaryMax}</p> : null}
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setModal(null)} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={submit} disabled={!canSave}>
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link to={routes.home} className="font-bold text-[#1e3456] text-xl tracking-tight">
            FirsTep
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <section className="flex-1 w-full">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Empresa</p>
                  <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">
                    Bienvenido{session.companyName ? `, ${session.companyName}` : ""}
                  </h1>
                  <p className="mt-2 text-sm text-slate-600">
                    Publica tus trabajos y recibe postulaciones de talentos.
                  </p>
                </div>
                <Button onClick={openCreate} disabled={!token}>
                  Publicar nuevo trabajo
                </Button>
              </div>

              {error ? (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0">{error}</span>
                    {!token ? (
                      <Button size="sm" onClick={() => navigate(routes.companyLogin)}>
                        Iniciar sesión
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-800">Tus trabajos</p>
                <div className="mt-3 space-y-3">
                  {isLoading ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      Cargando...
                    </div>
                  ) : jobs.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      Aún no tienes trabajos publicados.
                    </div>
                  ) : (
                    jobs.map((j) => (
                      <div key={j.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-slate-900 truncate">{j.title}</p>
                              <span
                                className={[
                                  "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                                  j.status === "active"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200",
                                ].join(" ")}
                              >
                                {j.status === "active" ? "Activo" : "Pausado"}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {j.location ? `${j.location} · ` : ""}
                              {j.employmentType.replaceAll("_", " ")} · {j.seniority} · {formatTime(j.createdAt)}
                            </p>
                            <p className="mt-2 text-sm text-slate-700 line-clamp-2">{j.description}</p>
                            <p className="mt-2 text-xs text-slate-500">
                              Postulaciones: <span className="font-semibold text-slate-700">{j.applicantsCount}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button variant="secondary" size="sm" onClick={() => openEdit(j)} disabled={isLoading}>
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleStatus(j)}
                              className="border-slate-200 text-slate-700 hover:bg-slate-50"
                              disabled={isLoading}
                            >
                              {j.status === "active" ? "Pausar" : "Activar"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="w-full lg:w-[360px]">
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <p className="text-sm font-semibold text-slate-800">Consejos</p>
              <div className="mt-3 text-sm text-slate-600 space-y-2">
                <p>
                  Una descripción clara mejora la calidad de las postulaciones.
                </p>
                <p>
                  Mantén tus trabajos activos solo si estás recibiendo candidatos actualmente.
                </p>
              </div>
              <div className="mt-5">
                <Link to={routes.home}>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-700 hover:bg-slate-50">
                    Volver al inicio
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
