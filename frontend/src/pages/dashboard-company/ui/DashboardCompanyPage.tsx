import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button, Input, Select } from "@/shared/ui";

type Tab = "overview" | "jobs" | "applicants" | "chat";
type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
type Seniority = "junior" | "mid" | "senior";
type JobStatus = "active" | "paused" | "closed";
type ApplicantStatus = "submitted" | "withdrawn" | "rejected" | "accepted";

type CompanyProfile = {
  companyName: string | null;
  legalName: string | null;
  taxId: string | null;
  companySize: string | null;
  industry: string | null;
  activitySector: string | null;
  location: string | null;
  description: string | null;
  verificationStatus: "pending" | "verified";
};

type DashboardData = {
  stats: {
    jobsCount: number;
    activeJobsCount: number;
    applicationsCount: number;
    conversationsCount: number;
  };
  recentJobs: Array<{ id: number; title: string; status: string; applicationDeadline: string | null; updatedAt: string }>;
  recentApplications: Array<{ id: number; status: string; createdAt: string; jobId: number; jobTitle: string; candidateName: string | null }>;
};

type JobRow = {
  id: number;
  title: string;
  description: string;
  requirements: string | null;
  benefits: string | null;
  location: string | null;
  employmentType: EmploymentType;
  seniority: Seniority;
  salaryMin: number | null;
  salaryMax: number | null;
  applicationDeadline: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  applicantsCount: number;
};

type ApplicantRow = {
  id: number;
  jobId: number;
  jobTitle: string;
  talentUserId: number;
  talentEmail: string;
  fullName: string | null;
  location: string | null;
  headline: string | null;
  careerInterests: string[] | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  cvTitles: string[];
  coverLetter: string | null;
  status: ApplicantStatus;
  createdAt: string;
};

type ConversationRow = {
  id: number;
  applicationId: number;
  companyUserId: number;
  talentUserId: number;
  candidateName: string | null;
  candidateEmail: string;
  jobTitle: string;
  lastMessageAt: string | null;
};

type MessageRow = {
  id: number;
  senderUserId: number;
  body: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  scheduledInterviewAt: string | null;
  createdAt: string;
};

const employmentTypeLabel: Record<EmploymentType, string> = {
  full_time: "Tiempo completo",
  part_time: "Medio tiempo",
  contract: "Contrato",
  internship: "Prácticas",
};

const seniorityLabel: Record<Seniority, string> = {
  junior: "Junior",
  mid: "Mid",
  senior: "Senior",
};

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value: string | null) {
  if (!value) return "Sin actividad";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Sin actividad";
  return parsed.toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseOptionalInt(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < 0) return { error: "Debe ser un numero entero valido." as const };
  return num;
}

function getApiErrorMessage(status: number, data: any, fallback: string) {
  if (typeof data?.error?.message === "string" && data.error.message) return data.error.message;
  return `${fallback} (${status}).`;
}

export function DashboardCompanyPage() {
  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("firststep.api.accessToken") ?? "", []);

  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [isBootLoading, setIsBootLoading] = useState(true);

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [applicants, setApplicants] = useState<ApplicantRow[]>([]);
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);

  const [filters, setFilters] = useState({ query: "", skills: "", experience: "", status: "all", jobId: "all" });

  const [modal, setModal] = useState<null | "create" | { editId: number }>(null);
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formRequirements, setFormRequirements] = useState("");
  const [formBenefits, setFormBenefits] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formEmploymentType, setFormEmploymentType] = useState<EmploymentType>("full_time");
  const [formSeniority, setFormSeniority] = useState<Seniority>("junior");
  const [formSalaryMin, setFormSalaryMin] = useState("");
  const [formSalaryMax, setFormSalaryMax] = useState("");
  const [formDeadline, setFormDeadline] = useState("");

  const [messageBody, setMessageBody] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [interviewAt, setInterviewAt] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const [applicantModal, setApplicantModal] = useState<null | { applicationId: number }>(null);
  const [applicantDetail, setApplicantDetail] = useState<null | { application: any; cvs: Array<{ id: string; title: string; content: string; updatedAt: string }> }>(null);
  const [isLoadingApplicant, setIsLoadingApplicant] = useState(false);

  const formErrors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!formTitle.trim()) next.title = "El cargo solicitado es obligatorio.";
    if (!formDescription.trim()) next.description = "Debes describir la oportunidad.";
    const min = parseOptionalInt(formSalaryMin);
    const max = parseOptionalInt(formSalaryMax);
    if (min !== null && typeof min === "object") next.salaryMin = min.error;
    if (max !== null && typeof max === "object") next.salaryMax = max.error;
    if (typeof min === "number" && typeof max === "number" && min > max) next.salaryMax = "El maximo debe ser mayor o igual al minimo.";
    return next;
  }, [formDescription, formSalaryMax, formSalaryMin, formTitle]);

  const activeConversation = conversations.find((item) => item.id === activeConversationId) ?? null;

  function resetJobForm() {
    setFormTitle("");
    setFormDescription("");
    setFormRequirements("");
    setFormBenefits("");
    setFormLocation("");
    setFormEmploymentType("full_time");
    setFormSeniority("junior");
    setFormSalaryMin("");
    setFormSalaryMax("");
    setFormDeadline("");
  }

  function openCreateModal() {
    resetJobForm();
    setModal("create");
  }

  function openEditModal(job: JobRow) {
    setFormTitle(job.title);
    setFormDescription(job.description);
    setFormRequirements(job.requirements ?? "");
    setFormBenefits(job.benefits ?? "");
    setFormLocation(job.location ?? "");
    setFormEmploymentType(job.employmentType);
    setFormSeniority(job.seniority);
    setFormSalaryMin(job.salaryMin === null ? "" : String(job.salaryMin));
    setFormSalaryMax(job.salaryMax === null ? "" : String(job.salaryMax));
    setFormDeadline(job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().slice(0, 16) : "");
    setModal({ editId: job.id });
  }

  async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {}
      throw new Error(getApiErrorMessage(res.status, data, "La operacion no se pudo completar"));
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadConversationFile(conversationId: number, file: File) {
    const dataBase64 = await readFileAsDataUrl(file);
    return await fetchJson<{ url: string; file: { id: number; fileName: string; mimeType: string; sizeBytes: number } }>(
      `/api/conversations/${conversationId}/files`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || null,
          dataBase64,
        }),
      },
    );
  }

  async function loadDashboard() {
    const out = await fetchJson<{ profile: CompanyProfile | null; stats: DashboardData["stats"]; recentJobs: DashboardData["recentJobs"]; recentApplications: DashboardData["recentApplications"]; onboardingCompleted: boolean }>("/api/company/dashboard");
    setProfile(out.profile);
    setDashboard({
      stats: out.stats,
      recentJobs: out.recentJobs ?? [],
      recentApplications: out.recentApplications ?? [],
    });
    if (!out.onboardingCompleted) navigate(routes.companyOnboarding);
  }

  async function loadJobs() {
    const out = await fetchJson<{ jobs: JobRow[] }>("/api/company/jobs");
    setJobs(out.jobs ?? []);
  }

  async function loadApplicants(nextFilters = filters) {
    const params = new URLSearchParams();
    if (nextFilters.query.trim()) params.set("query", nextFilters.query.trim());
    if (nextFilters.skills.trim()) params.set("skills", nextFilters.skills.trim());
    if (nextFilters.experience.trim()) params.set("experience", nextFilters.experience.trim());
    if (nextFilters.status !== "all") params.set("status", nextFilters.status);
    if (nextFilters.jobId !== "all") params.set("jobId", nextFilters.jobId);
    const out = await fetchJson<{ applicants: ApplicantRow[] }>(`/api/company/applicants${params.size ? `?${params.toString()}` : ""}`);
    setApplicants(out.applicants ?? []);
  }

  async function loadConversations() {
    const out = await fetchJson<{ conversations: ConversationRow[] }>("/api/company/conversations");
    setConversations(out.conversations ?? []);
    if (!activeConversationId && out.conversations?.[0]) setActiveConversationId(out.conversations[0].id);
  }

  async function loadConversationMessages(conversationId: number) {
    const out = await fetchJson<{ messages: MessageRow[] }>(`/api/company/conversations/${conversationId}/messages`);
    setMessages(out.messages ?? []);
  }

  useEffect(() => {
    if (!token) {
      setError("No hay sesion valida. Vuelve a iniciar sesion.");
      setIsBootLoading(false);
      return;
    }
    (async () => {
      try {
        setError(null);
        await Promise.all([loadDashboard(), loadJobs(), loadApplicants(filters), loadConversations()]);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsBootLoading(false);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!activeConversationId || !token) return;
    void loadConversationMessages(activeConversationId).catch((e) => {
      setError(e instanceof Error ? e.message : String(e));
    });
  }, [activeConversationId, token]);

  async function handleSaveJob() {
    if (!token || Object.keys(formErrors).length > 0 || isSavingJob) return;
    setIsSavingJob(true);
    setError(null);
    try {
      const salaryMin = parseOptionalInt(formSalaryMin);
      const salaryMax = parseOptionalInt(formSalaryMax);
      const payload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        requirements: formRequirements.trim() || null,
        benefits: formBenefits.trim() || null,
        location: formLocation.trim() || null,
        employmentType: formEmploymentType,
        seniority: formSeniority,
        salaryMin: typeof salaryMin === "number" ? salaryMin : null,
        salaryMax: typeof salaryMax === "number" ? salaryMax : null,
        applicationDeadline: formDeadline ? new Date(formDeadline).toISOString() : null,
      };
      const isEdit = typeof modal === "object" && modal !== null;
      await fetchJson(isEdit ? `/api/company/jobs/${modal.editId}` : "/api/company/jobs", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setModal(null);
      await Promise.all([loadJobs(), loadDashboard()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSavingJob(false);
    }
  }

  async function handleJobStatus(job: JobRow, nextStatus: JobStatus) {
    try {
      await fetchJson(`/api/company/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      await Promise.all([loadJobs(), loadDashboard()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleDeleteJob(jobId: number) {
    try {
      await fetchJson(`/api/company/jobs/${jobId}`, { method: "DELETE" });
      await Promise.all([loadJobs(), loadDashboard(), loadApplicants(filters)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleApplicantStatus(applicationId: number, status: ApplicantStatus) {
    try {
      await fetchJson(`/api/company/applicants/${applicationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await Promise.all([loadApplicants(filters), loadDashboard()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleContactApplicant(applicationId: number) {
    try {
      const out = await fetchJson<{ conversation: ConversationRow }>(`/api/company/applicants/${applicationId}/contact`, {
        method: "POST",
      });
      setTab("chat");
      await loadConversations();
      setActiveConversationId(out.conversation.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleSendMessage() {
    const hasBody = Boolean(messageBody.trim());
    const hasAttachment = Boolean(attachmentUrl.trim() || attachmentFile);
    if (!activeConversationId || (!hasBody && !hasAttachment) || isSendingMessage || isUploadingAttachment) return;
    setIsSendingMessage(true);
    try {
      setError(null);
      let finalAttachmentUrl = attachmentUrl.trim() || null;
      let finalAttachmentName = attachmentName.trim() || null;
      if (attachmentFile && !finalAttachmentUrl) {
        setIsUploadingAttachment(true);
        const uploaded = await uploadConversationFile(activeConversationId, attachmentFile);
        finalAttachmentUrl = uploaded.url;
        finalAttachmentName = finalAttachmentName || uploaded.file.fileName;
      }
      await fetchJson(`/api/company/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: messageBody.trim() || "Adjunto",
          attachmentName: finalAttachmentName,
          attachmentUrl: finalAttachmentUrl,
          scheduledInterviewAt: interviewAt ? new Date(interviewAt).toISOString() : null,
        }),
      });
      setMessageBody("");
      setAttachmentName("");
      setAttachmentUrl("");
      setAttachmentFile(null);
      setInterviewAt("");
      await Promise.all([loadConversationMessages(activeConversationId), loadConversations(), loadDashboard()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSendingMessage(false);
      setIsUploadingAttachment(false);
    }
  }

  async function openApplicantDetail(applicationId: number) {
    if (!token) return;
    setApplicantModal({ applicationId });
    setApplicantDetail(null);
    setIsLoadingApplicant(true);
    setError(null);
    try {
      const out = await fetchJson<{ application: any; cvs: Array<{ id: string; title: string; content: string; updatedAt: string }> }>(
        `/api/company/applicants/${applicationId}`,
      );
      setApplicantDetail(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setApplicantModal(null);
    } finally {
      setIsLoadingApplicant(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
        <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">No hay sesion valida</h1>
          <p className="mt-3 text-sm text-slate-500">Inicia sesion como empresa para administrar oportunidades y candidatos.</p>
          <Button className="mt-5" onClick={() => navigate(routes.companyLogin)}>
            Iniciar sesion
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      {applicantModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => setApplicantModal(null)} />
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Postulante</p>
                <h2 className="text-lg font-bold text-slate-900">Detalle de candidato</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setApplicantModal(null)}>
                Cerrar
              </Button>
            </div>
            <div className="p-6">
              {isLoadingApplicant ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  Cargando perfil...
                </div>
              ) : applicantDetail ? (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">{applicantDetail.application?.fullName || applicantDetail.application?.talentEmail}</p>
                    <p className="mt-1 text-slate-600">{applicantDetail.application?.headline || "Sin titular"}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {applicantDetail.application?.location || "Ubicación no indicada"} · {applicantDetail.application?.jobTitle}
                    </p>
                  </div>
                  {applicantDetail.application?.coverLetter ? (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Carta / Motivación</p>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{applicantDetail.application.coverLetter}</p>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Documentos (CV)</p>
                    <div className="mt-3 space-y-3">
                      {applicantDetail.cvs.map((cv) => (
                        <div key={cv.id} className="rounded-2xl border border-slate-200 p-4">
                          <p className="text-sm font-semibold text-slate-900">{cv.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDateTime(cv.updatedAt)}</p>
                          <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-700 whitespace-pre-wrap">
                            {cv.content}
                          </pre>
                        </div>
                      ))}
                      {!applicantDetail.cvs.length ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                          El candidato aún no tiene CV guardado en la plataforma.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  Sin datos para mostrar.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Oportunidad</p>
                <h2 className="text-lg font-bold text-slate-900">{typeof modal === "string" ? "Publicar nuevo trabajo" : "Editar trabajo"}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>
                Cerrar
              </Button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Cargo solicitado</label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Ej. Disenador UX Senior" />
                {formErrors.title ? <p className="mt-2 text-xs text-red-700">{formErrors.title}</p> : null}
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Descripcion</label>
                <textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="min-h-28 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#294266]/20" placeholder="Describe responsabilidades, alcance y objetivos de la oportunidad." />
                {formErrors.description ? <p className="mt-2 text-xs text-red-700">{formErrors.description}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Requisitos</label>
                <textarea value={formRequirements} onChange={(e) => setFormRequirements(e.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#294266]/20" placeholder="Experiencia, stack, idioma, certificaciones..." />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Beneficios</label>
                <textarea value={formBenefits} onChange={(e) => setFormBenefits(e.target.value)} className="min-h-24 w-full rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#294266]/20" placeholder="Beneficios, modalidad, rango y perks." />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ubicacion</label>
                <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Bogota / remoto" />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tipo de contratacion</label>
                <Select value={formEmploymentType} onChange={(e) => setFormEmploymentType(e.target.value as EmploymentType)}>
                  <option value="full_time">Tiempo completo</option>
                  <option value="part_time">Medio tiempo</option>
                  <option value="contract">Contrato</option>
                  <option value="internship">Practicas</option>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nivel</label>
                <Select value={formSeniority} onChange={(e) => setFormSeniority(e.target.value as Seniority)}>
                  <option value="junior">Junior</option>
                  <option value="mid">Mid</option>
                  <option value="senior">Senior</option>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fecha limite</label>
                <Input type="datetime-local" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Salario minimo</label>
                <Input value={formSalaryMin} onChange={(e) => setFormSalaryMin(e.target.value)} placeholder="2000" />
                {formErrors.salaryMin ? <p className="mt-2 text-xs text-red-700">{formErrors.salaryMin}</p> : null}
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Salario maximo</label>
                <Input value={formSalaryMax} onChange={(e) => setFormSalaryMax(e.target.value)} placeholder="3500" />
                {formErrors.salaryMax ? <p className="mt-2 text-xs text-red-700">{formErrors.salaryMax}</p> : null}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button disabled={Object.keys(formErrors).length > 0 || isSavingJob} onClick={() => void handleSaveJob()}>
                {isSavingJob ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#294266]">Cuenta empresarial</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{profile?.companyName || session.companyName || "Tu empresa"}</h1>
            <p className="mt-1 text-sm text-slate-500">Gestiona oportunidades, postulantes y conversaciones desde un solo lugar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={openCreateModal}>Publicar nuevo trabajo</Button>
            <Button variant="outline" onClick={() => navigate(routes.companyOnboarding)}>Editar onboarding</Button>
            <Button variant="outline" onClick={logout}>Cerrar sesion</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        {error ? <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        {isBootLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-10 text-center text-sm text-slate-500 shadow-sm">Cargando panel empresarial...</div>
        ) : (
          <div className="space-y-6">
            <section className="grid gap-4 md:grid-cols-4">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Oportunidades</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.jobsCount ?? 0}</p>
                <p className="mt-2 text-sm text-slate-500">Publicadas desde tu cuenta.</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Activas</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.activeJobsCount ?? 0}</p>
                <p className="mt-2 text-sm text-slate-500">Listas para recibir postulaciones.</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Postulaciones</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.applicationsCount ?? 0}</p>
                <p className="mt-2 text-sm text-slate-500">Candidatos en proceso dentro de la plataforma.</p>
              </article>
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chats</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{dashboard?.stats.conversationsCount ?? 0}</p>
                <p className="mt-2 text-sm text-slate-500">Conversaciones privadas abiertas.</p>
              </article>
            </section>

            <section className="flex flex-wrap gap-2">
              {[
                ["overview", "Resumen"],
                ["jobs", "Oportunidades"],
                ["applicants", "Postulantes"],
                ["chat", "Chat privado"],
              ].map(([key, label]) => (
                <Button key={key} variant={tab === key ? "primary" : "secondary"} size="sm" onClick={() => setTab(key as Tab)}>
                  {label}
                </Button>
              ))}
            </section>

            {tab === "overview" ? (
              <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Resumen de actividad</h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {(dashboard?.recentJobs ?? []).map((item) => (
                      <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-xs text-slate-500">Estado: {item.status}</p>
                        <p className="mt-1 text-xs text-slate-500">Limite: {formatDate(item.applicationDeadline)}</p>
                      </div>
                    ))}
                    {!dashboard?.recentJobs?.length ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">Todavia no tienes oportunidades recientes. Publica la primera para activar tu pipeline.</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold text-slate-900">Perfil empresarial</h2>
                  <div className="mt-5 space-y-3 text-sm text-slate-600">
                    <p><span className="font-semibold text-slate-900">Razon social:</span> {profile?.legalName || "Pendiente"}</p>
                    <p><span className="font-semibold text-slate-900">Fiscal:</span> {profile?.taxId || "Pendiente"}</p>
                    <p><span className="font-semibold text-slate-900">Sector:</span> {profile?.activitySector || "Pendiente"}</p>
                    <p><span className="font-semibold text-slate-900">Ubicacion:</span> {profile?.location || "Pendiente"}</p>
                    <p><span className="font-semibold text-slate-900">Verificacion:</span> {profile?.verificationStatus === "verified" ? "Verificada" : "Pendiente"}</p>
                  </div>
                </div>
              </section>
            ) : null}

            {tab === "jobs" ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Publicacion de oportunidades</h2>
                    <p className="mt-1 text-sm text-slate-500">Crea, edita, pausa, reactiva, cierra o elimina oportunidades con estado en tiempo real.</p>
                  </div>
                  <Button onClick={openCreateModal}>Publicar nuevo trabajo</Button>
                </div>

                {jobs.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-lg font-semibold text-slate-900">Aun no tienes trabajos publicados</p>
                    <p className="mt-2 text-sm text-slate-500">Publica la primera oportunidad para empezar a recibir postulaciones.</p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-4 xl:grid-cols-2">
                    {jobs.map((job) => (
                      <article key={job.id} className="rounded-2xl border border-slate-200 bg-[#fcfdff] p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{job.status}</span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">{job.location || "Ubicacion flexible"} · {employmentTypeLabel[job.employmentType]} · {seniorityLabel[job.seniority]}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Postulantes</p>
                            <p className="text-2xl font-bold text-slate-900">{job.applicantsCount}</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-600">{job.description}</p>
                        {job.requirements ? <p className="mt-3 text-sm text-slate-500"><span className="font-semibold text-slate-700">Requisitos:</span> {job.requirements}</p> : null}
                        {job.benefits ? <p className="mt-2 text-sm text-slate-500"><span className="font-semibold text-slate-700">Beneficios:</span> {job.benefits}</p> : null}
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-3 py-1">Limite: {formatDate(job.applicationDeadline)}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1">Actualizado: {formatDate(job.updatedAt)}</span>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => openEditModal(job)}>Editar</Button>
                          {job.status !== "paused" ? (
                            <Button size="sm" variant="outline" onClick={() => void handleJobStatus(job, "paused")}>Pausar</Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => void handleJobStatus(job, "active")}>Activar</Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => void handleJobStatus(job, "closed")}>Cerrar</Button>
                          <Button size="sm" variant="ghost" onClick={() => void handleDeleteJob(job.id)}>Eliminar</Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : null}

            {tab === "applicants" ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
                  <div className="lg:flex-1">
                    <h2 className="text-xl font-bold text-slate-900">Gestion de postulantes</h2>
                    <p className="mt-1 text-sm text-slate-500">Filtra por experiencia, habilidades o estado para priorizar candidatos.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 lg:w-[820px] lg:grid-cols-3">
                    <Input value={filters.query} onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))} placeholder="Buscar por nombre o ubicación" />
                    <Input value={filters.skills} onChange={(e) => setFilters((prev) => ({ ...prev, skills: e.target.value }))} placeholder="Habilidades (ej. React, SQL)" />
                    <Input value={filters.experience} onChange={(e) => setFilters((prev) => ({ ...prev, experience: e.target.value }))} placeholder="Experiencia (ej. 2 años, senior)" />
                    <Select value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                      <option value="all">Todos los estados</option>
                      <option value="submitted">Recibida</option>
                      <option value="accepted">Aceptada</option>
                      <option value="rejected">Rechazada</option>
                      <option value="withdrawn">Retirada</option>
                    </Select>
                    <Select value={filters.jobId} onChange={(e) => setFilters((prev) => ({ ...prev, jobId: e.target.value }))}>
                      <option value="all">Todas las oportunidades</option>
                      {jobs.map((job) => <option key={job.id} value={String(job.id)}>{job.title}</option>)}
                    </Select>
                  </div>
                  <Button variant="secondary" onClick={() => void loadApplicants(filters)}>Aplicar filtros</Button>
                </div>

                <div className="mt-6 space-y-4">
                  {applicants.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">{item.fullName || item.talentEmail}</h3>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{item.status}</span>
                          </div>
                          <p className="text-sm text-slate-500">{item.jobTitle} · {item.location || "Ubicacion no indicada"} · {formatDateTime(item.createdAt)}</p>
                          {item.headline ? <p className="text-sm text-slate-600">{item.headline}</p> : null}
                          {item.coverLetter ? <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Motivacion:</span> {item.coverLetter}</p> : null}
                          {item.careerInterests?.length ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {item.careerInterests.map((interest) => (
                                <span key={interest} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{interest}</span>
                              ))}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                            {item.cvTitles.map((cv) => <span key={cv} className="rounded-full bg-slate-100 px-3 py-1">{cv}</span>)}
                            {item.linkedin ? <a className="rounded-full bg-slate-100 px-3 py-1 hover:text-slate-900" href={item.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> : null}
                            {item.github ? <a className="rounded-full bg-slate-100 px-3 py-1 hover:text-slate-900" href={item.github} target="_blank" rel="noreferrer">GitHub</a> : null}
                            {item.portfolio ? <a className="rounded-full bg-slate-100 px-3 py-1 hover:text-slate-900" href={item.portfolio} target="_blank" rel="noreferrer">Portafolio</a> : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 xl:w-[260px] xl:justify-end">
                          <Button size="sm" variant="secondary" onClick={() => void handleApplicantStatus(item.id, "accepted")}>Aceptar</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleApplicantStatus(item.id, "rejected")}>Rechazar</Button>
                          <Button size="sm" variant="outline" onClick={() => void openApplicantDetail(item.id)}>Ver perfil</Button>
                          <Button size="sm" variant="outline" onClick={() => void handleContactApplicant(item.id)}>Contactar</Button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {!applicants.length ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No hay postulantes con los filtros actuales.</div> : null}
                </div>
              </section>
            ) : null}

            {tab === "chat" ? (
              <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
                <aside className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <h2 className="text-xl font-bold text-slate-900">Chat privado</h2>
                    <p className="mt-1 text-sm text-slate-500">Solo empresa y postulante involucrado pueden acceder.</p>
                  </div>
                  <div className="space-y-3">
                    {conversations.map((item) => (
                      <button key={item.id} type="button" onClick={() => setActiveConversationId(item.id)} className={`w-full rounded-2xl border px-4 py-3 text-left transition ${activeConversationId === item.id ? "border-[#294266] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                        <p className="text-sm font-semibold text-slate-900">{item.candidateName || item.candidateEmail}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.jobTitle}</p>
                        <p className="mt-2 text-[11px] text-slate-400">{formatDateTime(item.lastMessageAt)}</p>
                      </button>
                    ))}
                    {!conversations.length ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">Contacta a un postulante desde la pestana de postulantes para abrir el primer chat.</div> : null}
                  </div>
                </aside>

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  {activeConversation ? (
                    <>
                      <div className="border-b border-slate-100 px-6 py-4">
                        <h3 className="text-lg font-bold text-slate-900">{activeConversation.candidateName || activeConversation.candidateEmail}</h3>
                        <p className="mt-1 text-sm text-slate-500">{activeConversation.jobTitle}</p>
                      </div>
                      <div className="max-h-[420px] space-y-3 overflow-y-auto px-6 py-5">
                        {messages.map((message) => (
                          <article
                            key={message.id}
                            className={`max-w-xl rounded-2xl px-4 py-3 text-sm ${
                              message.senderUserId === activeConversation.companyUserId ? "bg-blue-50" : "bg-slate-100"
                            }`}
                          >
                            <p className="text-slate-700">{message.body}</p>
                            {message.attachmentUrl ? (
                              <a className="mt-2 inline-block text-xs font-semibold text-blue-700 underline" href={message.attachmentUrl} target="_blank" rel="noreferrer">
                                {message.attachmentName || "Adjunto"}
                              </a>
                            ) : null}
                            {message.scheduledInterviewAt ? <p className="mt-2 text-xs text-emerald-700">Entrevista programada: {formatDateTime(message.scheduledInterviewAt)}</p> : null}
                            <p className="mt-2 text-[11px] text-slate-400">{formatDateTime(message.createdAt)}</p>
                          </article>
                        ))}
                        {!messages.length ? <p className="text-sm text-slate-500">Aun no hay mensajes en esta conversacion.</p> : null}
                      </div>
                      <div className="border-t border-slate-100 px-6 py-4">
                        <div className="grid gap-3 md:grid-cols-3">
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0] ?? null;
                              setAttachmentFile(file);
                              if (file) {
                                setAttachmentName((prev) => prev.trim() || file.name);
                                setAttachmentUrl("");
                              }
                            }}
                          />
                          <Input value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="Nombre del archivo adjunto" />
                          <Input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="URL segura del archivo" />
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-[1fr,220px]">
                          <Input value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Escribe un mensaje privado o comparte proximos pasos" />
                          <Input type="datetime-local" value={interviewAt} onChange={(e) => setInterviewAt(e.target.value)} />
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            onClick={() => void handleSendMessage()}
                            disabled={(!messageBody.trim() && !attachmentUrl.trim() && !attachmentFile) || isSendingMessage || isUploadingAttachment}
                          >
                            {isUploadingAttachment ? "Subiendo archivo..." : isSendingMessage ? "Enviando..." : "Enviar mensaje"}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex min-h-[420px] items-center justify-center px-6 text-center text-sm text-slate-500">Selecciona una conversacion para ver mensajes, compartir archivos o programar entrevistas.</div>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
