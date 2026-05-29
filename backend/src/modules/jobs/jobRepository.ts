import type { Db } from "../../shared/db/postgreSQL";

import type { CreateJobInput, Job, JobWithCompany, UpdateJobInput } from "./types";

export class JobRepository {
  constructor(private readonly db: Db) { }

  async create(companyUserId: number, input: CreateJobInput): Promise<Job> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO jobs
        (company_user_id, title, description, location, employment_type, seniority, salary_min, salary_max, status, created_at, updated_at)
       VALUES
        (:companyUserId, :title, :description, :location, :employmentType, :seniority, :salaryMin, :salaryMax, 'active', NOW(), NOW())
       RETURNING
        id,
        company_user_id as "companyUserId",
        title,
        description,
        location,
        employment_type as "employmentType",
        seniority,
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      { companyUserId, ...input },
    );
    return row as Job;
  }

  async listForCompany(companyUserId: number): Promise<Array<Job & { applicantsCount: number }>> {
    const rows = await this.db.queryMany<any>(
      `SELECT j.id,
              j.company_user_id as "companyUserId",
              j.title,
              j.description,
              j.location,
              j.employment_type as "employmentType",
              j.seniority,
              j.salary_min as "salaryMin",
              j.salary_max as "salaryMax",
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

  async getForCompany(companyUserId: number, jobId: number): Promise<Job | null> {
    const row = await this.db.queryOne<any>(
      `SELECT id,
              company_user_id as "companyUserId",
              title,
              description,
              location,
              employment_type as "employmentType",
              seniority,
              salary_min as "salaryMin",
              salary_max as "salaryMax",
              status,
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM jobs
       WHERE id = :jobId AND company_user_id = :companyUserId`,
      { jobId, companyUserId },
    );
    return row ?? null;
  }

  async updateForCompany(companyUserId: number, jobId: number, input: UpdateJobInput): Promise<Job | null> {
    const current = await this.getForCompany(companyUserId, jobId);
    if (!current) return null;
    const next = {
      title: input.title ?? current.title,
      description: input.description ?? current.description,
      location: input.location ?? current.location,
      employmentType: input.employmentType ?? current.employmentType,
      seniority: input.seniority ?? current.seniority,
      salaryMin: input.salaryMin ?? current.salaryMin,
      salaryMax: input.salaryMax ?? current.salaryMax,
      status: input.status ?? current.status,
    };

    const row = await this.db.queryOne<any>(
      `UPDATE jobs SET
        title = :title,
        description = :description,
        location = :location,
        employment_type = :employmentType,
        seniority = :seniority,
        salary_min = :salaryMin,
        salary_max = :salaryMax,
        status = :status,
        updated_at = NOW()
       WHERE id = :jobId AND company_user_id = :companyUserId
       RETURNING
        id,
        company_user_id as "companyUserId",
        title,
        description,
        location,
        employment_type as "employmentType",
        seniority,
        salary_min as "salaryMin",
        salary_max as "salaryMax",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"`,
      { companyUserId, jobId, ...next },
    );
    return row ?? null;
  }

  async listActiveForTalent(talentUserId: number): Promise<Array<JobWithCompany & { hasApplied: boolean }>> {
    const rows = await this.db.queryMany<any>(
      `SELECT j.id,
              j.company_user_id as "companyUserId",
              cp.company_name as "companyName",
              j.title,
              j.description,
              j.location,
              j.employment_type as "employmentType",
              j.seniority,
              j.salary_min as "salaryMin",
              j.salary_max as "salaryMax",
              j.status,
              j.created_at as "createdAt",
              j.updated_at as "updatedAt",
              (ja.id IS NOT NULL) as "hasApplied"
       FROM jobs j
       LEFT JOIN company_profiles cp ON cp.user_id = j.company_user_id
       LEFT JOIN job_applications ja ON ja.job_id = j.id AND ja.talent_user_id = :talentUserId AND ja.status = 'submitted'
       WHERE j.status = 'active'
       ORDER BY j.created_at DESC
       LIMIT 50`,
      { talentUserId },
    );
    return rows;
  }

  async apply(jobId: number, talentUserId: number, coverLetter: string | null) {
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
}

