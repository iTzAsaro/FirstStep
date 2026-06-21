// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      backend/src/modules/jobs                                ║
// ║ Descripción: Tipos de dominio para ofertas de empleo y postulaciones.║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Estados posibles para una oferta de empleo.
 */
export type JobStatus = "active" | "paused" | "closed";

/**
 * Tipos de jornada para una oferta de empleo.
 */
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship";

/**
 * Niveles de experiencia para una oferta de empleo.
 */
export type Seniority = "junior" | "mid" | "senior";

/**
 * Oferta de empleo persistida en base de datos.
 */
export type Job = {
  id: number;
  companyUserId: number;
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
};

/**
 * Oferta de empleo con el nombre de la empresa.
 */
export type JobWithCompany = Job & { companyName: string | null };

/**
 * Datos necesarios para crear una oferta de empleo.
 */
export type CreateJobInput = Pick<
  Job,
  | "title"
  | "description"
  | "requirements"
  | "benefits"
  | "location"
  | "employmentType"
  | "seniority"
  | "salaryMin"
  | "salaryMax"
  | "applicationDeadline"
>;

/**
 * Datos para actualizar una oferta de empleo.
 */
export type UpdateJobInput = Partial<CreateJobInput> & Partial<Pick<Job, "status">>;

/**
 * Estados posibles para una postulación a una oferta de empleo.
 */
export type JobApplicationStatus = "submitted" | "withdrawn" | "rejected" | "accepted";

/**
 * Postulación a una oferta de empleo.
 */
export type JobApplication = {
  id: number;
  jobId: number;
  talentUserId: number;
  coverLetter: string | null;
  status: JobApplicationStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Postulación a una oferta con datos del talento.
 */
export type JobApplicationWithTalent = JobApplication & {
  jobTitle: string;
  talentEmail: string;
  fullName: string | null;
  location: string | null;
  headline: string | null;
  careerInterests: string[] | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  cvTitles: string[];
};

/**
 * Conversación entre empresa y talento asociada a una postulación.
 */
export type CompanyConversation = {
  id: number;
  applicationId: number;
  companyUserId: number;
  talentUserId: number;
  jobTitle: string;
  candidateName: string | null;
  candidateEmail: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mensaje de una conversación entre empresa y talento.
 */
export type ConversationMessage = {
  id: number;
  conversationId: number;
  senderUserId: number;
  body: string;
  attachmentName: string | null;
  attachmentUrl: string | null;
  scheduledInterviewAt: string | null;
  createdAt: string;
  updatedAt: string;
};
