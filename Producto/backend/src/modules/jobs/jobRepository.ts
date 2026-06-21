// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     jobRepository.ts                                        ║
// ║ Módulo:      backend/src/modules/jobs                                ║
// ║ Descripción: Repositorio para ofertas de empleo y postulaciones      ║
// ║ Creado:      20-05-2026                                              ║
// ╚═════════════════════════════════════════════════════════════════════╝

import type { Db } from "../../shared/db/postgreSQL";

import type {
  CompanyConversation,
  ConversationMessage,
  CreateJobInput,
  Job,
  JobApplicationWithTalent,
  JobWithCompany,
  UpdateJobInput,
} from "./types";

/**
 * Repositorio de ofertas de empleo y postulaciones
 */
export class JobRepository {
  constructor(private readonly db: Db) { }

  /**
   * Crea una nueva oferta de empleo para una empresa
   */
  async create(companyUserId: number, input: CreateJobInput): Promise<Job> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO jobs
        (company_user_id, title, description, requirements, benefits, location, employment_type, seniority, salary_min, salary_max, application_deadline, status, created_at, updated_at)
       VALUES
        (:companyUserId, :title, :description, :requirements, :benefits, :location, :employmentType, :seniority, :salaryMin, :salaryMax, :applicationDeadline, 'active', NOW(), NOW())
       RETURNING
        id,
        company_user_id as "companyUserId",
        title,
        description,
        requirements,
        benefits,
        location,
        employment_type as "employmentType",
        seniority,
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        application_deadline as "applicationDeadline",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      { companyUserId, ...input },
    );
    return row as Job;
  }

  /**
   * Lista todas las ofertas de una empresa con conteo de postulantes
   */
  async listForCompany(companyUserId: number): Promise<Array<Job & { applicantsCount: number }>> {
    const rows = await this.db.queryMany<any>(
      `SELECT j.id,
              j.company_user_id as "companyUserId",
              j.title,
              j.description,
              j.requirements,
              j.benefits,
              j.location,
              j.employment_type as "employmentType",
              j.seniority,
              j.salary_min as "salaryMin",
              j.salary_max as "salaryMax",
              j.application_deadline as "applicationDeadline",
              j.status,
              j.created_at as "createdAt",
              j.updated_at as "updatedAt",
              COALESCE(a.cnt, 0)::int as "applicantsCount"
       FROM jobs j
       LEFT JOIN (
         SELECT job_id, COUNT(*) as cnt
         FROM job_applications
         WHERE status = 'submitted'
         GROUP BY job_id
       ) a ON a.job_id = j.id
       WHERE j.company_user_id = :companyUserId
       ORDER BY j.created_at DESC`,
      { companyUserId },
    );
    return rows;
  }

  /**
   * Obtiene una oferta de empleo por id para una empresa
   */
  async getForCompany(companyUserId: number, jobId: number): Promise<Job | null> {
    const row = await this.db.queryOne<any>(
      `SELECT id,
              company_user_id as "companyUserId",
              title,
              description,
              requirements,
              benefits,
              location,
              employment_type as "employmentType",
              seniority,
              salary_min as "salaryMin",
              salary_max as "salaryMax",
              application_deadline as "applicationDeadline",
              status,
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM jobs
       WHERE id = :jobId AND company_user_id = :companyUserId`,
      { jobId, companyUserId },
    );
    return row ?? null;
  }

  /**
   * Actualiza una oferta de empleo existente para una empresa
   */
  async updateForCompany(companyUserId: number, jobId: number, input: UpdateJobInput): Promise<Job | null> {
    const current = await this.getForCompany(companyUserId, jobId);
    if (!current) return null;
    const next = {
      title: input.title ?? current.title,
      description: input.description ?? current.description,
      requirements: input.requirements ?? current.requirements,
      benefits: input.benefits ?? current.benefits,
      location: input.location ?? current.location,
      employmentType: input.employmentType ?? current.employmentType,
      seniority: input.seniority ?? current.seniority,
      salaryMin: input.salaryMin ?? current.salaryMin,
      salaryMax: input.salaryMax ?? current.salaryMax,
      applicationDeadline: input.applicationDeadline ?? current.applicationDeadline,
      status: input.status ?? current.status,
    };

    const row = await this.db.queryOne<any>(
      `UPDATE jobs SET
        title = :title,
        description = :description,
        requirements = :requirements,
        benefits = :benefits,
        location = :location,
        employment_type = :employmentType,
        seniority = :seniority,
        salary_min = :salaryMin,
        salary_max = :salaryMax,
        application_deadline = :applicationDeadline,
        status = :status,
        updated_at = NOW()
       WHERE id = :jobId AND company_user_id = :companyUserId
       RETURNING
        id,
        company_user_id as "companyUserId",
        title,
        description,
        requirements,
        benefits,
        location,
        employment_type as "employmentType",
        seniority,
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        application_deadline as "applicationDeadline",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      { companyUserId, jobId, ...next },
    );
    return row ?? null;
  }

  /**
   * Lista ofertas activas para un talento, con indicador si ya postuló
   */
  async listActiveForTalent(talentUserId: number): Promise<Array<JobWithCompany & { hasApplied: boolean }>> {
    const rows = await this.db.queryMany<any>(
      `SELECT j.id,
              j.company_user_id as "companyUserId",
              cp.company_name as "companyName",
              j.title,
              j.description,
              j.requirements,
              j.benefits,
              j.location,
              j.employment_type as "employmentType",
              j.seniority,
              j.salary_min as "salaryMin",
              j.salary_max as "salaryMax",
              j.application_deadline as "applicationDeadline",
              j.status,
              j.created_at as "createdAt",
              j.updated_at as "updatedAt",
              (ja.id IS NOT NULL) as "hasApplied"
       FROM jobs j
       LEFT JOIN company_profiles cp ON cp.user_id = j.company_user_id
       LEFT JOIN job_applications ja ON ja.job_id = j.id AND ja.talent_user_id = :talentUserId AND ja.status = 'submitted'
       WHERE j.status = 'active'
        AND (j.application_deadline IS NULL OR j.application_deadline >= NOW())
       ORDER BY j.created_at DESC
       LIMIT 50`,
      { talentUserId },
    );
    return rows;
  }

  /**
   * Crea o actualiza una postulación de un talento a una oferta
   */
  async apply(jobId: number, talentUserId: number, coverLetter: string | null) {
    const job = await this.db.queryOne<any>(
      `SELECT status, application_deadline as "applicationDeadline"
       FROM jobs
       WHERE id = :jobId`,
      { jobId },
    );
    if (!job) return null;
    if (job.status !== "active") return null;
    if (job.applicationDeadline) {
      const deadline = new Date(String(job.applicationDeadline));
      if (Number.isFinite(deadline.getTime()) && deadline.getTime() < Date.now()) return null;
    }

    const row = await this.db.queryOne<any>(
      `INSERT INTO job_applications
        (job_id, talent_user_id, cover_letter, status, created_at, updated_at)
       VALUES
        (:jobId, :talentUserId, :coverLetter, 'submitted', NOW(), NOW())
       ON CONFLICT (job_id, talent_user_id) DO UPDATE SET
        cover_letter = EXCLUDED.cover_letter,
        status = 'submitted',
        updated_at = NOW()
       RETURNING
        id,
        job_id as "jobId",
        talent_user_id as "talentUserId",
        cover_letter as "coverLetter",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      { jobId, talentUserId, coverLetter },
    );
    return row;
  }

  /**
   * Elimina una oferta de empleo de una empresa
   */
  async deleteForCompany(companyUserId: number, jobId: number) {
    const row = await this.db.queryOne<any>(
      `DELETE FROM jobs
       WHERE id = :jobId AND company_user_id = :companyUserId
       RETURNING id`,
      { companyUserId, jobId },
    );
    return row ?? null;
  }

  /**
   * Obtiene un resumen del dashboard para una empresa
   */
  async getDashboardSummary(companyUserId: number) {
    const stats = await this.db.queryOne<any>(
      `SELECT
          (SELECT COUNT(*)::int FROM jobs WHERE company_user_id = :companyUserId) as "jobsCount",
          (SELECT COUNT(*)::int FROM jobs WHERE company_user_id = :companyUserId AND status = 'active') as "activeJobsCount",
          (SELECT COUNT(*)::int
             FROM job_applications ja
             JOIN jobs j ON j.id = ja.job_id
            WHERE j.company_user_id = :companyUserId) as "applicationsCount",
          (SELECT COUNT(*)::int
             FROM application_conversations ac
            WHERE ac.company_user_id = :companyUserId) as "conversationsCount"`,
      { companyUserId },
    );

    const recentJobs = await this.db.queryMany<any>(
      `SELECT id,
              title,
              status,
              application_deadline as "applicationDeadline",
              updated_at as "updatedAt"
       FROM jobs
       WHERE company_user_id = :companyUserId
       ORDER BY updated_at DESC
       LIMIT 5`,
      { companyUserId },
    );

    const recentApplications = await this.db.queryMany<any>(
      `SELECT ja.id,
              ja.status,
              ja.created_at as "createdAt",
              j.id as "jobId",
              j.title as "jobTitle",
              tp.full_name as "candidateName"
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       LEFT JOIN talent_profiles tp ON tp.user_id = ja.talent_user_id
       WHERE j.company_user_id = :companyUserId
       ORDER BY ja.created_at DESC
       LIMIT 8`,
      { companyUserId },
    );

    return {
      stats: {
        jobsCount: stats?.jobsCount ?? 0,
        activeJobsCount: stats?.activeJobsCount ?? 0,
        applicationsCount: stats?.applicationsCount ?? 0,
        conversationsCount: stats?.conversationsCount ?? 0,
      },
      recentJobs,
      recentApplications,
    };
  }

  /**
   * Lista postulantes para una empresa con filtros opcionales
   */
  async listApplicantsForCompany(
    companyUserId: number,
    filters: { jobId?: number | null; query?: string | null; status?: string | null; skills?: string | null; experience?: string | null },
  ): Promise<JobApplicationWithTalent[]> {
    const query = filters.query?.trim() ? `%${filters.query.trim().toLowerCase()}%` : null;
    const skills = filters.skills?.trim() ? `%${filters.skills.trim().toLowerCase()}%` : null;
    const experience = filters.experience?.trim() ? `%${filters.experience.trim().toLowerCase()}%` : null;
    const rows = await this.db.queryMany<any>(
      `SELECT ja.id,
              ja.job_id as "jobId",
              ja.talent_user_id as "talentUserId",
              ja.cover_letter as "coverLetter",
              ja.status,
              ja.created_at as "createdAt",
              ja.updated_at as "updatedAt",
              j.title as "jobTitle",
              u.email as "talentEmail",
              tp.full_name as "fullName",
              tp.location,
              tp.headline,
              tp.career_interests as "careerInterests",
              tp.linkedin,
              tp.github,
              tp.portfolio,
              COALESCE(cv.titles, ARRAY[]::text[]) as "cvTitles"
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN users u ON u.id = ja.talent_user_id
       LEFT JOIN talent_profiles tp ON tp.user_id = ja.talent_user_id
       LEFT JOIN (
         SELECT user_id, array_agg(title ORDER BY updated_at DESC) as titles
         FROM cvs
         GROUP BY user_id
       ) cv ON cv.user_id = ja.talent_user_id
       WHERE j.company_user_id = :companyUserId
         AND (:jobId::bigint IS NULL OR ja.job_id = :jobId)
         AND (:status::text IS NULL OR ja.status = :status)
         AND (
           :skills::text IS NULL
           OR LOWER(COALESCE(tp.full_name, '')) LIKE :skills
           OR LOWER(COALESCE(tp.headline, '')) LIKE :skills
           OR EXISTS (
             SELECT 1
             FROM cvs c
             WHERE c.user_id = ja.talent_user_id AND LOWER(c.content) LIKE :skills
           )
         )
         AND (
           :experience::text IS NULL
           OR LOWER(COALESCE(tp.full_name, '')) LIKE :experience
           OR LOWER(COALESCE(tp.headline, '')) LIKE :experience
           OR EXISTS (
             SELECT 1
             FROM cvs c
             WHERE c.user_id = ja.talent_user_id AND LOWER(c.content) LIKE :experience
           )
         )
         AND (
           :query::text IS NULL
           OR LOWER(COALESCE(tp.full_name, '')) LIKE :query
           OR LOWER(COALESCE(tp.headline, '')) LIKE :query
           OR LOWER(COALESCE(tp.location, '')) LIKE :query
           OR EXISTS (
             SELECT 1
             FROM unnest(COALESCE(tp.career_interests, ARRAY[]::text[])) as interest
             WHERE LOWER(interest) LIKE :query
           )
         )
       ORDER BY ja.created_at DESC`,
      {
        companyUserId,
        jobId: filters.jobId ?? null,
        status: filters.status ?? null,
        query,
        skills,
        experience,
      },
    );
    return rows;
  }

  /**
   * Obtiene una postulación por id para una empresa
   */
  async getApplicationForCompany(companyUserId: number, applicationId: number) {
    const row = await this.db.queryOne<any>(
      `SELECT ja.id,
              ja.job_id as "jobId",
              ja.talent_user_id as "talentUserId",
              ja.status
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       WHERE ja.id = :applicationId AND j.company_user_id = :companyUserId`,
      { companyUserId, applicationId },
    );
    return row ?? null;
  }

  /**
   * Actualiza el estado de una postulación para una empresa
   */
  async updateApplicationStatusForCompany(companyUserId: number, applicationId: number, status: string) {
    const row = await this.db.queryOne<any>(
      `UPDATE job_applications ja
       SET status = :status,
           updated_at = NOW()
       FROM jobs j
       WHERE ja.job_id = j.id
         AND ja.id = :applicationId
         AND j.company_user_id = :companyUserId
       RETURNING ja.id`,
      { companyUserId, applicationId, status },
    );
    return row ?? null;
  }

  /**
   * Obtiene los detalles de un postulante para una empresa
   */
  async getApplicantDetailForCompany(companyUserId: number, applicationId: number) {
    const application = await this.db.queryOne<any>(
      `SELECT ja.id,
              ja.job_id as "jobId",
              ja.talent_user_id as "talentUserId",
              ja.cover_letter as "coverLetter",
              ja.status,
              ja.created_at as "createdAt",
              j.title as "jobTitle",
              u.email as "talentEmail",
              tp.full_name as "fullName",
              tp.location,
              tp.headline,
              tp.career_interests as "careerInterests",
              tp.linkedin,
              tp.github,
              tp.portfolio
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN users u ON u.id = ja.talent_user_id
       LEFT JOIN talent_profiles tp ON tp.user_id = ja.talent_user_id
       WHERE ja.id = :applicationId AND j.company_user_id = :companyUserId`,
      { companyUserId, applicationId },
    );
    if (!application) return null;

    const cvs = await this.db.queryMany<any>(
      `SELECT id::text as id,
              title,
              content,
              updated_at as "updatedAt"
       FROM cvs
       WHERE user_id = :talentUserId
       ORDER BY updated_at DESC
       LIMIT 10`,
      { talentUserId: application.talentUserId },
    );

    return { application, cvs };
  }

  /**
   * Abre una conversación para una postulación existente
   */
  async openConversationForApplication(companyUserId: number, applicationId: number): Promise<CompanyConversation | null> {
    const application = await this.db.queryOne<any>(
      `SELECT ja.id as "applicationId",
              ja.talent_user_id as "talentUserId",
              j.title as "jobTitle",
              u.email as "candidateEmail",
              tp.full_name as "candidateName"
       FROM job_applications ja
       JOIN jobs j ON j.id = ja.job_id
       JOIN users u ON u.id = ja.talent_user_id
       LEFT JOIN talent_profiles tp ON tp.user_id = ja.talent_user_id
       WHERE ja.id = :applicationId AND j.company_user_id = :companyUserId`,
      { companyUserId, applicationId },
    );
    if (!application) return null;

    await this.db.execute(
      `INSERT INTO application_conversations (application_id, company_user_id, talent_user_id, created_at, updated_at)
       VALUES (:applicationId, :companyUserId, :talentUserId, NOW(), NOW())
       ON CONFLICT (application_id) DO NOTHING`,
      {
        applicationId,
        companyUserId,
        talentUserId: application.talentUserId,
      },
    );

    return await this.db.queryOne<any>(
      `SELECT ac.id,
              ac.application_id as "applicationId",
              ac.company_user_id as "companyUserId",
              ac.talent_user_id as "talentUserId",
              j.title as "jobTitle",
              u.email as "candidateEmail",
              tp.full_name as "candidateName",
              (
                SELECT cm.created_at
                FROM conversation_messages cm
                WHERE cm.conversation_id = ac.id
                ORDER BY cm.created_at DESC
                LIMIT 1
              ) as "lastMessageAt",
              ac.created_at as "createdAt",
              ac.updated_at as "updatedAt"
       FROM application_conversations ac
       JOIN job_applications ja ON ja.id = ac.application_id
       JOIN jobs j ON j.id = ja.job_id
       JOIN users u ON u.id = ac.talent_user_id
       LEFT JOIN talent_profiles tp ON tp.user_id = ac.talent_user_id
       WHERE ac.application_id = :applicationId AND ac.company_user_id = :companyUserId`,
      { applicationId, companyUserId },
    );
  }

  /**
   * Lista todas las conversaciones de una empresa
   */
  async listConversationsForCompany(companyUserId: number): Promise<CompanyConversation[]> {
    const rows = await this.db.queryMany<any>(
      `SELECT ac.id,
              ac.application_id as "applicationId",
              ac.company_user_id as "companyUserId",
              ac.talent_user_id as "talentUserId",
              j.title as "jobTitle",
              u.email as "candidateEmail",
              tp.full_name as "candidateName",
              (
                SELECT cm.created_at
                FROM conversation_messages cm
                WHERE cm.conversation_id = ac.id
                ORDER BY cm.created_at DESC
                LIMIT 1
              ) as "lastMessageAt",
              ac.created_at as "createdAt",
              ac.updated_at as "updatedAt"
       FROM application_conversations ac
       JOIN job_applications ja ON ja.id = ac.application_id
       JOIN jobs j ON j.id = ja.job_id
       JOIN users u ON u.id = ac.talent_user_id
       LEFT JOIN talent_profiles tp ON tp.user_id = ac.talent_user_id
       WHERE ac.company_user_id = :companyUserId
       ORDER BY COALESCE((
         SELECT cm.created_at
         FROM conversation_messages cm
         WHERE cm.conversation_id = ac.id
         ORDER BY cm.created_at DESC
         LIMIT 1
       ), ac.updated_at) DESC`,
      { companyUserId },
    );
    return rows;
  }

  /**
   * Obtiene una conversación por id para una empresa
   */
  async getConversationForCompany(companyUserId: number, conversationId: number): Promise<CompanyConversation | null> {
    const row = await this.db.queryOne<any>(
      `SELECT ac.id,
              ac.application_id as "applicationId",
              ac.company_user_id as "companyUserId",
              ac.talent_user_id as "talentUserId",
              j.title as "jobTitle",
              u.email as "candidateEmail",
              tp.full_name as "candidateName",
              (
                SELECT cm.created_at
                FROM conversation_messages cm
                WHERE cm.conversation_id = ac.id
                ORDER BY cm.created_at DESC
                LIMIT 1
              ) as "lastMessageAt",
              ac.created_at as "createdAt",
              ac.updated_at as "updatedAt"
       FROM application_conversations ac
       JOIN job_applications ja ON ja.id = ac.application_id
       JOIN jobs j ON j.id = ja.job_id
       JOIN users u ON u.id = ac.talent_user_id
       LEFT JOIN talent_profiles tp ON tp.user_id = ac.talent_user_id
       WHERE ac.id = :conversationId AND ac.company_user_id = :companyUserId`,
      { companyUserId, conversationId },
    );
    return row ?? null;
  }

  /**
   * Lista todas las conversaciones de un talento
   */
  async listConversationsForTalent(talentUserId: number): Promise<CompanyConversation[]> {
    const rows = await this.db.queryMany<any>(
      `SELECT ac.id,
              ac.application_id as "applicationId",
              ac.company_user_id as "companyUserId",
              ac.talent_user_id as "talentUserId",
              j.title as "jobTitle",
              cu.email as "candidateEmail",
              cp.company_name as "candidateName",
              (
                SELECT cm.created_at
                FROM conversation_messages cm
                WHERE cm.conversation_id = ac.id
                ORDER BY cm.created_at DESC
                LIMIT 1
              ) as "lastMessageAt",
              ac.created_at as "createdAt",
              ac.updated_at as "updatedAt"
       FROM application_conversations ac
       JOIN job_applications ja ON ja.id = ac.application_id
       JOIN jobs j ON j.id = ja.job_id
       JOIN users cu ON cu.id = ac.company_user_id
       LEFT JOIN company_profiles cp ON cp.user_id = ac.company_user_id
       WHERE ac.talent_user_id = :talentUserId
       ORDER BY COALESCE((
         SELECT cm.created_at
         FROM conversation_messages cm
         WHERE cm.conversation_id = ac.id
         ORDER BY cm.created_at DESC
         LIMIT 1
       ), ac.updated_at) DESC`,
      { talentUserId },
    );
    return rows;
  }

  /**
   * Obtiene una conversación por id para un talento
   */
  async getConversationForTalent(talentUserId: number, conversationId: number): Promise<CompanyConversation | null> {
    const row = await this.db.queryOne<any>(
      `SELECT ac.id,
              ac.application_id as "applicationId",
              ac.company_user_id as "companyUserId",
              ac.talent_user_id as "talentUserId",
              j.title as "jobTitle",
              cu.email as "candidateEmail",
              cp.company_name as "candidateName",
              (
                SELECT cm.created_at
                FROM conversation_messages cm
                WHERE cm.conversation_id = ac.id
                ORDER BY cm.created_at DESC
                LIMIT 1
              ) as "lastMessageAt",
              ac.created_at as "createdAt",
              ac.updated_at as "updatedAt"
       FROM application_conversations ac
       JOIN job_applications ja ON ja.id = ac.application_id
       JOIN jobs j ON j.id = ja.job_id
       JOIN users cu ON cu.id = ac.company_user_id
       LEFT JOIN company_profiles cp ON cp.user_id = ac.company_user_id
       WHERE ac.id = :conversationId AND ac.talent_user_id = :talentUserId`,
      { conversationId, talentUserId },
    );
    return row ?? null;
  }

  /**
   * Lista todos los mensajes de una conversación
   */
  async listMessagesForConversation(conversationId: number): Promise<ConversationMessage[]> {
    const rows = await this.db.queryMany<any>(
      `SELECT id,
              conversation_id as "conversationId",
              sender_user_id as "senderUserId",
              body,
              attachment_name as "attachmentName",
              attachment_url as "attachmentUrl",
              scheduled_interview_at as "scheduledInterviewAt",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM conversation_messages
       WHERE conversation_id = :conversationId
       ORDER BY created_at ASC`,
      { conversationId },
    );
    return rows;
  }

  /**
   * Crea un nuevo mensaje en una conversación
   */
  async createMessageForConversation(
    conversationId: number,
    senderUserId: number,
    input: { body: string; attachmentName: string | null; attachmentUrl: string | null; scheduledInterviewAt: string | null },
  ): Promise<ConversationMessage> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO conversation_messages
        (conversation_id, sender_user_id, body, attachment_name, attachment_url, scheduled_interview_at, created_at, updated_at)
       VALUES
        (:conversationId, :senderUserId, :body, :attachmentName, :attachmentUrl, :scheduledInterviewAt, NOW(), NOW())
       RETURNING
        id,
        conversation_id as "conversationId",
        sender_user_id as "senderUserId",
        body,
        attachment_name as "attachmentName",
        attachment_url as "attachmentUrl",
        scheduled_interview_at as "scheduledInterviewAt",
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      { conversationId, senderUserId, ...input },
    );

    await this.db.execute(
      `UPDATE application_conversations
       SET updated_at = NOW()
       WHERE id = :conversationId`,
      { conversationId },
    );

    return row as ConversationMessage;
  }

  /**
   * Verifica que un usuario sea participante de una conversación
   */
  async getConversationForParticipant(userId: number, conversationId: number) {
    const row = await this.db.queryOne<any>(
      `SELECT id,
              company_user_id as "companyUserId",
              talent_user_id as "talentUserId"
       FROM application_conversations
       WHERE id = :conversationId
         AND (:userId::bigint = company_user_id OR :userId::bigint = talent_user_id)`,
      { userId, conversationId },
    );
    return row ?? null;
  }

  /**
   * Crea un archivo adjunto en una conversación
   */
  async createFileForConversation(
    conversationId: number,
    uploaderUserId: number,
    input: { fileName: string; mimeType: string; data: Buffer },
  ) {
    const row = await this.db.queryOne<any>(
      `INSERT INTO conversation_files
        (conversation_id, uploader_user_id, file_name, mime_type, size_bytes, data, created_at)
       VALUES
        (:conversationId, :uploaderUserId, :fileName, :mimeType, :sizeBytes, :data, NOW())
       RETURNING
        id,
        conversation_id as "conversationId",
        uploader_user_id as "uploaderUserId",
        file_name as "fileName",
        mime_type as "mimeType",
        size_bytes as "sizeBytes",
        created_at as "createdAt"`,
      {
        conversationId,
        uploaderUserId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.data.length,
        data: input.data,
      },
    );
    return row as {
      id: number;
      conversationId: number;
      uploaderUserId: number;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      createdAt: string;
    };
  }

  /**
   * Obtiene un archivo adjunto si el usuario es participante de la conversación
   */
  async getFileForParticipant(userId: number, fileId: number) {
    const row = await this.db.queryOne<any>(
      `SELECT cf.id,
              cf.conversation_id as "conversationId",
              cf.file_name as "fileName",
              cf.mime_type as "mimeType",
              cf.size_bytes as "sizeBytes",
              cf.data,
              cf.created_at as "createdAt"
       FROM conversation_files cf
       JOIN application_conversations ac ON ac.id = cf.conversation_id
       WHERE cf.id = :fileId
         AND (:userId::bigint = ac.company_user_id OR :userId::bigint = ac.talent_user_id)`,
      { userId, fileId },
    );
    return row ?? null;
  }
}
