import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button, Input, Select } from "@/shared/ui";

type Tab = "overview" | "jobs" | "applicants" | "chat" | "profile";
type EmploymentType = "full_time" | "part_time" | "contract" | "internship";
type Seniority = "junior" | "mid" | "senior";
type JobStatus = "active" | "paused" | "closed";
type ApplicantStatus = "submitted" | "withdrawn" | "rejected" | "accepted";
type ListViewMode = "cards" | "table";

type CompanyProfile = {
  companyName: string | null;
  legalName: string | null;
  taxId: string | null;
  companySize: string | null;
  industry: string | null;
  activitySector: string | null;
  location: string | null;
  address: string | null;
  contactEmail: string | null;
  website?: string | null;
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

  const [jobsQuery, setJobsQuery] = useState("");
  const [jobsStatus, setJobsStatus] = useState<"all" | JobStatus>("all");
  const [jobsView, setJobsView] = useState<ListViewMode>("cards");
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPageSize, setJobsPageSize] = useState(10);

  const [applicantsQuery, setApplicantsQuery] = useState("");
  const [applicantsSkills, setApplicantsSkills] = useState("");
  const [applicantsExperience, setApplicantsExperience] = useState("");
  const [applicantsStatus, setApplicantsStatus] = useState<"all" | ApplicantStatus>("all");
  const [applicantsJobId, setApplicantsJobId] = useState<"all" | string>("all");
  const [applicantsView, setApplicantsView] = useState<ListViewMode>("table");
  const [applicantsPage, setApplicantsPage] = useState(1);
  const [applicantsPageSize, setApplicantsPageSize] = useState(10);

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

  const [toast, setToast] = useState<null | { kind: "success" | "error"; title: string; message?: string }>(null);
  const [confirm, setConfirm] = useState<null | { title: string; message: string; actionLabel: string; onConfirm: () => void }>(null);

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

  const filteredJobs = useMemo(() => {
    const q = jobsQuery.trim().toLowerCase();
    return jobs
      .filter((job) => (jobsStatus === "all" ? true : job.status === jobsStatus))
      .filter((job) => {
        if (!q) return true;
        return (
          job.title.toLowerCase().includes(q) ||
          job.description.toLowerCase().includes(q) ||
          (job.location ?? "").toLowerCase().includes(q)
        );
      });
  }, [jobs, jobsQuery, jobsStatus]);

  const jobsTotalPages = useMemo(() => Math.max(1, Math.ceil(filteredJobs.length / jobsPageSize)), [filteredJobs.length, jobsPageSize]);
  const pagedJobs = useMemo(() => {
    const start = (jobsPage - 1) * jobsPageSize;
    return filteredJobs.slice(start, start + jobsPageSize);
  }, [filteredJobs, jobsPage, jobsPageSize]);

  const filteredApplicants = useMemo(() => {
    const q = applicantsQuery.trim().toLowerCase();
    const skills = applicantsSkills.trim().toLowerCase();
    const exp = applicantsExperience.trim().toLowerCase();
    return applicants
      .filter((app) => (applicantsStatus === "all" ? true : app.status === applicantsStatus))
      .filter((app) => (applicantsJobId === "all" ? true : String(app.jobId) === String(applicantsJobId)))
      .filter((app) => {
        if (!q && !skills && !exp) return true;
        const haystack = [
          app.jobTitle,
          app.talentEmail,
          app.fullName ?? "",
          app.location ?? "",
          app.headline ?? "",
          ...(app.careerInterests ?? []),
          app.coverLetter ?? "",
          ...app.cvTitles,
        ]
          .join(" ")
          .toLowerCase();
        if (q && !haystack.includes(q)) return false;
        if (skills && !haystack.includes(skills)) return false;
        if (exp && !haystack.includes(exp)) return false;
        return true;
      });
  }, [applicants, applicantsExperience, applicantsJobId, applicantsQuery, applicantsSkills, applicantsStatus]);

  const applicantsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredApplicants.length / applicantsPageSize)),
    [applicantsPageSize, filteredApplicants.length],
  );
  const pagedApplicants = useMemo(() => {
    const start = (applicantsPage - 1) * applicantsPageSize;
    return filteredApplicants.slice(start, start + applicantsPageSize);
  }, [applicantsPage, applicantsPageSize, filteredApplicants]);

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
    try {
      const raw = localStorage.getItem("firststep.company.jobDraft.v1");
      if (raw) {
        const draft = JSON.parse(raw) as any;
        if (typeof draft?.title === "string") setFormTitle(draft.title);
        if (typeof draft?.description === "string") setFormDescription(draft.description);
        if (typeof draft?.requirements === "string") setFormRequirements(draft.requirements);
        if (typeof draft?.benefits === "string") setFormBenefits(draft.benefits);
        if (typeof draft?.location === "string") setFormLocation(draft.location);
        if (typeof draft?.employmentType === "string") setFormEmploymentType(draft.employmentType);
        if (typeof draft?.seniority === "string") setFormSeniority(draft.seniority);
        if (typeof draft?.salaryMin === "string") setFormSalaryMin(draft.salaryMin);
        if (typeof draft?.salaryMax === "string") setFormSalaryMax(draft.salaryMax);
        if (typeof draft?.deadline === "string") setFormDeadline(draft.deadline);
      }
    } catch { }
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

  async function loadApplicants() {
    const out = await fetchJson<{ applicants: ApplicantRow[] }>("/api/company/applicants");
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
        await Promise.all([loadDashboard(), loadJobs(), loadApplicants(), loadConversations()]);
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

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (modal !== "create") return;
    try {
      localStorage.setItem(
        "firststep.company.jobDraft.v1",
        JSON.stringify({
          title: formTitle,
          description: formDescription,
          requirements: formRequirements,
          benefits: formBenefits,
          location: formLocation,
          employmentType: formEmploymentType,
          seniority: formSeniority,
          salaryMin: formSalaryMin,
          salaryMax: formSalaryMax,
          deadline: formDeadline,
        }),
      );
    } catch { }
  }, [
    formBenefits,
    formDeadline,
    formDescription,
    formEmploymentType,
    formLocation,
    formRequirements,
    formSalaryMax,
    formSalaryMin,
    formSeniority,
    formTitle,
    modal,
  ]);

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
      if (!isEdit) {
        try {
          localStorage.removeItem("firststep.company.jobDraft.v1");
        } catch { }
      }
      setModal(null);
      await Promise.all([loadJobs(), loadDashboard()]);
      setToast({ kind: "success", title: isEdit ? "Oportunidad actualizada" : "Oportunidad publicada" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setToast({ kind: "error", title: "No se pudo guardar", message: e instanceof Error ? e.message : String(e) });
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
      await Promise.all([loadJobs(), loadDashboard(), loadApplicants()]);
      setToast({ kind: "success", title: "Oportunidad eliminada" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setToast({ kind: "error", title: "No se pudo eliminar", message: e instanceof Error ? e.message : String(e) });
    }
  }

  async function handleApplicantStatus(applicationId: number, status: ApplicantStatus) {
    try {
      await fetchJson(`/api/company/applicants/${applicationId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await Promise.all([loadApplicants(), loadDashboard()]);
      setToast({ kind: "success", title: "Estado actualizado" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setToast({ kind: "error", title: "No se pudo actualizar", message: e instanceof Error ? e.message : String(e) });
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
      {toast ? (
        <div className="fixed right-4 top-4 z-[60] w-[min(420px,calc(100vw-2rem))]" role="status" aria-live="polite">
          <div
            className={`rounded-2xl border px-4 py-3 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.25)] ${
              toast.kind === "success" ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${toast.kind === "success" ? "text-emerald-900" : "text-red-900"}`}>{toast.title}</p>
                {toast.message ? <p className={`mt-1 text-sm ${toast.kind === "success" ? "text-emerald-800" : "text-red-800"}`}>{toast.message}</p> : null}
              </div>
              <button type="button" className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-white/60" onClick={() => setToast(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirm ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/50" onClick={() => setConfirm(null)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)]">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">{confirm.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{confirm.message}</p>
            </div>
            <div className="flex flex-col-reverse gap-3 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  const run = confirm.onConfirm;
                  setConfirm(null);
                  run();
                }}
              >
                {confirm.actionLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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
            <Button variant="outline" onClick={() => setTab("profile")}>Perfil</Button>
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
                ["profile", "Empresa"],
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
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Publicación de oportunidades</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Crea, edita y controla el estado de tus oportunidades con filtros rápidos y vistas flexibles.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={jobsView === "cards" ? "primary" : "secondary"}
                      onClick={() => setJobsView("cards")}
                    >
                      Tarjetas
                    </Button>
                    <Button
                      size="sm"
                      variant={jobsView === "table" ? "primary" : "secondary"}
                      onClick={() => setJobsView("table")}
                    >
                      Tabla
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void loadJobs()}>
                      Recargar
                    </Button>
                    <Button onClick={openCreateModal}>Publicar nuevo trabajo</Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-12">
                  <div className="lg:col-span-6">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Buscar
                    </label>
                    <Input value={jobsQuery} onChange={(e) => { setJobsQuery(e.target.value); setJobsPage(1); }} placeholder="Cargo, ubicación, descripción…" />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </label>
                    <Select value={jobsStatus} onChange={(e) => { setJobsStatus(e.target.value as any); setJobsPage(1); }}>
                      <option value="all">Todos</option>
                      <option value="active">Activa</option>
                      <option value="paused">Pausada</option>
                      <option value="closed">Cerrada</option>
                    </Select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Por página
                    </label>
                    <Select value={String(jobsPageSize)} onChange={(e) => { setJobsPageSize(Number(e.target.value)); setJobsPage(1); }}>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Mostrando <span className="font-semibold text-slate-800">{pagedJobs.length}</span> de{" "}
                    <span className="font-semibold text-slate-800">{filteredJobs.length}</span> oportunidades
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" disabled={jobsPage <= 1} onClick={() => setJobsPage((p) => Math.max(1, p - 1))}>
                      Anterior
                    </Button>
                    <span className="text-sm text-slate-600">
                      Página {jobsPage} / {jobsTotalPages}
                    </span>
                    <Button size="sm" variant="secondary" disabled={jobsPage >= jobsTotalPages} onClick={() => setJobsPage((p) => Math.min(jobsTotalPages, p + 1))}>
                      Siguiente
                    </Button>
                  </div>
                </div>

                <div className="mt-5">
                  {jobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                      <p className="text-lg font-semibold text-slate-900">Aún no tienes trabajos publicados</p>
                      <p className="mt-2 text-sm text-slate-500">Publica la primera oportunidad para empezar a recibir postulaciones.</p>
                    </div>
                  ) : filteredJobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                      <p className="text-lg font-semibold text-slate-900">Sin resultados</p>
                      <p className="mt-2 text-sm text-slate-500">Prueba con otros filtros o limpia la búsqueda.</p>
                    </div>
                  ) : jobsView === "table" ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Cargo</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3">Ubicación</th>
                              <th className="px-4 py-3">Límite</th>
                              <th className="px-4 py-3">Postulantes</th>
                              <th className="px-4 py-3">Actualizado</th>
                              <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {pagedJobs.map((job) => (
                              <tr key={job.id} className="bg-white">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{job.title}</div>
                                  <div className="text-xs text-slate-500">{employmentTypeLabel[job.employmentType]} · {seniorityLabel[job.seniority]}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{job.status}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{job.location || "Flexible"}</td>
                                <td className="px-4 py-3 text-slate-600">{formatDate(job.applicationDeadline)}</td>
                                <td className="px-4 py-3 text-slate-900">{job.applicantsCount}</td>
                                <td className="px-4 py-3 text-slate-600">{formatDate(job.updatedAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => openEditModal(job)}>Editar</Button>
                                    {job.status !== "paused" ? (
                                      <Button size="sm" variant="outline" onClick={() => void handleJobStatus(job, "paused")}>Pausar</Button>
                                    ) : (
                                      <Button size="sm" variant="outline" onClick={() => void handleJobStatus(job, "active")}>Activar</Button>
                                    )}
                                    <Button size="sm" variant="outline" onClick={() => void handleJobStatus(job, "closed")}>Cerrar</Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setConfirm({
                                          title: "Eliminar oportunidad",
                                          message: "Esta acción es destructiva y eliminará la oportunidad y sus postulaciones asociadas.",
                                          actionLabel: "Eliminar",
                                          onConfirm: () => void handleDeleteJob(job.id),
                                        })
                                      }
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                      {pagedJobs.map((job) => (
                        <article key={job.id} className="rounded-2xl border border-slate-200 bg-[#fcfdff] p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{job.status}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">{job.location || "Ubicación flexible"} · {employmentTypeLabel[job.employmentType]} · {seniorityLabel[job.seniority]}</p>
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
                            <span className="rounded-full bg-slate-100 px-3 py-1">Límite: {formatDate(job.applicationDeadline)}</span>
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setConfirm({
                                  title: "Eliminar oportunidad",
                                  message: "Esta acción es destructiva y eliminará la oportunidad y sus postulaciones asociadas.",
                                  actionLabel: "Eliminar",
                                  onConfirm: () => void handleDeleteJob(job.id),
                                })
                              }
                            >
                              Eliminar
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            ) : null}

            {tab === "applicants" ? (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Gestión de postulantes</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Busca en tiempo real y prioriza candidatos por estado, oportunidad y señales de experiencia.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant={applicantsView === "table" ? "primary" : "secondary"}
                      onClick={() => setApplicantsView("table")}
                    >
                      Tabla
                    </Button>
                    <Button
                      size="sm"
                      variant={applicantsView === "cards" ? "primary" : "secondary"}
                      onClick={() => setApplicantsView("cards")}
                    >
                      Tarjetas
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void loadApplicants()}>
                      Recargar
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Buscar
                    </label>
                    <Input value={applicantsQuery} onChange={(e) => { setApplicantsQuery(e.target.value); setApplicantsPage(1); }} placeholder="Nombre, email, cargo, ubicación…" />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Habilidades
                    </label>
                    <Input value={applicantsSkills} onChange={(e) => { setApplicantsSkills(e.target.value); setApplicantsPage(1); }} placeholder="Ej. React, SQL, Node" />
                  </div>
                  <div className="lg:col-span-3">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Experiencia
                    </label>
                    <Input value={applicantsExperience} onChange={(e) => { setApplicantsExperience(e.target.value); setApplicantsPage(1); }} placeholder="Ej. 2 años, senior, lead" />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </label>
                    <Select value={applicantsStatus} onChange={(e) => { setApplicantsStatus(e.target.value as any); setApplicantsPage(1); }}>
                      <option value="all">Todos</option>
                      <option value="submitted">Recibida</option>
                      <option value="accepted">Aceptada</option>
                      <option value="rejected">Rechazada</option>
                      <option value="withdrawn">Retirada</option>
                    </Select>
                  </div>
                  <div className="lg:col-span-4">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Oportunidad
                    </label>
                    <Select value={applicantsJobId} onChange={(e) => { setApplicantsJobId(e.target.value); setApplicantsPage(1); }}>
                      <option value="all">Todas</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={String(job.id)}>
                          {job.title}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Por página
                    </label>
                    <Select value={String(applicantsPageSize)} onChange={(e) => { setApplicantsPageSize(Number(e.target.value)); setApplicantsPage(1); }}>
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Mostrando <span className="font-semibold text-slate-800">{pagedApplicants.length}</span> de{" "}
                    <span className="font-semibold text-slate-800">{filteredApplicants.length}</span> postulaciones
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" disabled={applicantsPage <= 1} onClick={() => setApplicantsPage((p) => Math.max(1, p - 1))}>
                      Anterior
                    </Button>
                    <span className="text-sm text-slate-600">
                      Página {applicantsPage} / {applicantsTotalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={applicantsPage >= applicantsTotalPages}
                      onClick={() => setApplicantsPage((p) => Math.min(applicantsTotalPages, p + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>

                <div className="mt-5">
                  {filteredApplicants.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                      <p className="text-lg font-semibold text-slate-900">Sin postulantes para mostrar</p>
                      <p className="mt-2 text-sm text-slate-500">Ajusta los filtros o publica una oportunidad para empezar a recibir candidaturas.</p>
                    </div>
                  ) : applicantsView === "table" ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Candidato</th>
                              <th className="px-4 py-3">Oportunidad</th>
                              <th className="px-4 py-3">Estado</th>
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {pagedApplicants.map((item) => (
                              <tr key={item.id} className="bg-white">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{item.fullName || item.talentEmail}</div>
                                  <div className="text-xs text-slate-500">{item.talentEmail}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="text-slate-900">{item.jobTitle}</div>
                                  <div className="text-xs text-slate-500">{item.location || "Ubicación no indicada"}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{item.status}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-600">{formatDateTime(item.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => void handleApplicantStatus(item.id, "accepted")}>Aceptar</Button>
                                    <Button size="sm" variant="outline" onClick={() => void handleApplicantStatus(item.id, "rejected")}>Rechazar</Button>
                                    <Button size="sm" variant="outline" onClick={() => void openApplicantDetail(item.id)}>Ver perfil</Button>
                                    <Button size="sm" variant="outline" onClick={() => void handleContactApplicant(item.id)}>Contactar</Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pagedApplicants.map((item) => (
                        <article key={item.id} className="rounded-2xl border border-slate-200 p-5">
                          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold text-slate-900">{item.fullName || item.talentEmail}</h3>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">{item.status}</span>
                              </div>
                              <p className="text-sm text-slate-500">{item.jobTitle} · {item.location || "Ubicación no indicada"} · {formatDateTime(item.createdAt)}</p>
                              {item.headline ? <p className="text-sm text-slate-600">{item.headline}</p> : null}
                              {item.coverLetter ? <p className="text-sm text-slate-600"><span className="font-semibold text-slate-800">Motivación:</span> {item.coverLetter}</p> : null}
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
                    </div>
                  )}
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

            {tab === "profile" ? (
              <section className="grid gap-6 lg:grid-cols-[1fr,360px]">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">Perfil de empresa</h2>
                      <p className="mt-1 text-sm text-slate-500">Mantén tus datos actualizados para mejorar la calidad de postulaciones y el cumplimiento.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="secondary" onClick={() => navigate(routes.companyOnboarding)}>
                        Editar datos
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Datos generales</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p><span className="font-semibold text-slate-900">Nombre comercial:</span> {profile?.companyName || "Pendiente"}</p>
                        <p><span className="font-semibold text-slate-900">Descripción:</span> {profile?.description || "Pendiente"}</p>
                        <p><span className="font-semibold text-slate-900">Ubicación:</span> {profile?.location || "Pendiente"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Datos fiscales</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p><span className="font-semibold text-slate-900">Razón social:</span> {profile?.legalName || "Pendiente"}</p>
                        <p><span className="font-semibold text-slate-900">Identificación:</span> {profile?.taxId || "Pendiente"}</p>
                        <p><span className="font-semibold text-slate-900">Tamaño:</span> {profile?.companySize || "Pendiente"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Actividad</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p><span className="font-semibold text-slate-900">Industria:</span> {profile?.industry || "Pendiente"}</p>
                        <p><span className="font-semibold text-slate-900">Sector:</span> {profile?.activitySector || "Pendiente"}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Verificación</p>
                      <div className="mt-3 space-y-2 text-sm text-slate-700">
                        <p><span className="font-semibold text-slate-900">Estado:</span> {profile?.verificationStatus === "verified" ? "Verificada" : "Pendiente"}</p>
                        <p className="text-xs text-slate-500">La verificación habilita más confianza y reduce fricción al contactar candidatos.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Atajos</p>
                  <div className="mt-4 space-y-2">
                    <Button variant="outline" className="w-full justify-center" onClick={() => setTab("jobs")}>
                      Ir a oportunidades
                    </Button>
                    <Button variant="outline" className="w-full justify-center" onClick={() => setTab("applicants")}>
                      Ir a postulantes
                    </Button>
                    <Button variant="outline" className="w-full justify-center" onClick={() => setTab("chat")}>
                      Ir a chat
                    </Button>
                  </div>
                </aside>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
