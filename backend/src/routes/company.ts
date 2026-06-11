// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     company.ts                                              ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Endpoints para perfil de empresa (protegido por rol).   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { CompanyProfileRepository } from "../modules/company/companyProfileRepository";
import { JobRepository } from "../modules/jobs/jobRepository";
import { authenticate } from "../shared/http/middleware/authenticate";
import { requireRole } from "../shared/http/middleware/requireRole";
import { Errors } from "../shared/http/middleware/errorHandler";
import { asNumberId, oneOf, optionalString, requiredString } from "../shared/validation/validators";

/**
 * Rutas de empresa:
 * - GET /profile
 * - PUT /profile
 *
 * Requiere JWT y rol "empresa".
 */
export function createCompanyRouter(ctx: AppContext) {
  const router = Router();
  const repo = new CompanyProfileRepository(ctx.db);
  const jobs = new JobRepository(ctx.db);

  router.use(authenticate(ctx.env), requireRole("empresa"));

  function parseOptionalInt(value: unknown, field: string) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw Errors.badRequest(`Campo '${field}' es inválido.`);
    return n;
  }

  function parseNullableInt(value: unknown, field: string) {
    if (value === undefined || value === null || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw Errors.badRequest(`Campo '${field}' es inválido.`);
    return n;
  }

  function parseOptionalIsoDate(value: unknown, field: string) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const iso = requiredString(value, field);
    const parsed = new Date(iso);
    if (!Number.isFinite(parsed.getTime())) throw Errors.badRequest(`Campo '${field}' es inválido.`);
    return parsed.toISOString();
  }

  router.get("/profile", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const profile = await repo.get(req.auth.id);
      return res.json({ profile, onboardingCompleted: repo.isOnboardingComplete(profile) });
    } catch (e) {
      return next(e);
    }
  });

  router.put("/profile", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const profile = await repo.upsert(req.auth.id, {
        companyName: optionalString(body.companyName, "companyName"),
        legalName: optionalString(body.legalName, "legalName"),
        taxId: optionalString(body.taxId, "taxId"),
        companySize: optionalString(body.companySize, "companySize"),
        industry: optionalString(body.industry, "industry"),
        activitySector: optionalString(body.activitySector, "activitySector"),
        location: optionalString(body.location, "location"),
        website: optionalString(body.website, "website"),
        description: optionalString(body.description, "description"),
        verificationStatus: body.verificationStatus ? oneOf(body.verificationStatus, "verificationStatus", ["pending", "verified"] as const) : undefined,
      });
      return res.json({ profile, onboardingCompleted: repo.isOnboardingComplete(profile) });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/onboarding", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const acceptedCompanyTerms = body.acceptedCompanyTerms === true;
      const verificationConfirmed = body.verificationConfirmed === true;
      if (!acceptedCompanyTerms || !verificationConfirmed) {
        throw Errors.badRequest("Debes verificar los datos empresariales y aceptar los términos específicos.");
      }

      const profile = await repo.upsert(req.auth.id, {
        companyName: requiredString(body.companyName, "companyName"),
        legalName: requiredString(body.legalName, "legalName"),
        taxId: requiredString(body.taxId, "taxId"),
        companySize: requiredString(body.companySize, "companySize"),
        industry: requiredString(body.industry, "industry"),
        activitySector: requiredString(body.activitySector, "activitySector"),
        location: requiredString(body.location, "location"),
        website: optionalString(body.website, "website"),
        description: requiredString(body.description, "description"),
        verificationStatus: "verified",
        verificationAcknowledgedAt: new Date().toISOString(),
        acceptedCompanyTermsAt: new Date().toISOString(),
      });

      return res.status(201).json({ profile, onboardingCompleted: repo.isOnboardingComplete(profile) });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/dashboard", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const profile = await repo.get(req.auth.id);
      const summary = await jobs.getDashboardSummary(req.auth.id);
      return res.json({
        profile,
        onboardingCompleted: repo.isOnboardingComplete(profile),
        ...summary,
      });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/jobs", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const rows = await jobs.listForCompany(req.auth.id);
      return res.json({ jobs: rows });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/jobs", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const parseOptionalInt = (value: unknown, field: string) => {
        if (value === undefined || value === null || value === "") return null;
        const n = Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw Errors.badRequest(`Campo '${field}' es inválido.`);
        return n;
      };

      const title = requiredString(body.title, "title");
      const description = requiredString(body.description, "description");
      const requirements = optionalString(body.requirements, "requirements");
      const benefits = optionalString(body.benefits, "benefits");
      const location = optionalString(body.location, "location");
      const employmentType = oneOf(body.employmentType ?? "full_time", "employmentType", [
        "full_time",
        "part_time",
        "contract",
        "internship",
      ] as const);
      const seniority = oneOf(body.seniority ?? "junior", "seniority", ["junior", "mid", "senior"] as const);
      const salaryMin = parseNullableInt(body.salaryMin, "salaryMin");
      const salaryMax = parseNullableInt(body.salaryMax, "salaryMax");
      const applicationDeadline = parseOptionalIsoDate(body.applicationDeadline, "applicationDeadline") ?? null;
      if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
        throw Errors.badRequest("Campo 'salaryMin' no puede ser mayor que 'salaryMax'.");
      }

      const job = await jobs.create(req.auth.id, {
        title,
        description,
        requirements,
        benefits,
        location,
        employmentType,
        seniority,
        salaryMin,
        salaryMax,
        applicationDeadline,
      });
      return res.status(201).json({ job });
    } catch (e) {
      return next(e);
    }
  });

  router.put("/jobs/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const jobId = asNumberId(req.params.id, "id");
      const body = req.body ?? {};
      const input: any = {};

      if (body.title !== undefined) input.title = requiredString(body.title, "title");
      if (body.description !== undefined) input.description = requiredString(body.description, "description");
      if (body.requirements !== undefined) input.requirements = optionalString(body.requirements, "requirements");
      if (body.benefits !== undefined) input.benefits = optionalString(body.benefits, "benefits");
      if (body.location !== undefined) input.location = optionalString(body.location, "location");
      if (body.employmentType !== undefined) {
        input.employmentType = oneOf(body.employmentType, "employmentType", [
          "full_time",
          "part_time",
          "contract",
          "internship",
        ] as const);
      }
      if (body.seniority !== undefined) {
        input.seniority = oneOf(body.seniority, "seniority", ["junior", "mid", "senior"] as const);
      }
      if (body.salaryMin !== undefined) {
        input.salaryMin = parseOptionalInt(body.salaryMin, "salaryMin");
      }
      if (body.salaryMax !== undefined) {
        input.salaryMax = parseOptionalInt(body.salaryMax, "salaryMax");
      }
      if (body.applicationDeadline !== undefined) {
        input.applicationDeadline = parseOptionalIsoDate(body.applicationDeadline, "applicationDeadline");
      }
      if (body.status !== undefined) input.status = oneOf(body.status, "status", ["active", "paused", "closed"] as const);

      if (input.salaryMin !== undefined && input.salaryMax !== undefined && input.salaryMin !== null && input.salaryMax !== null && input.salaryMin > input.salaryMax) {
        throw Errors.badRequest("Campo 'salaryMin' no puede ser mayor que 'salaryMax'.");
      }

      const job = await jobs.updateForCompany(req.auth.id, jobId, input);
      if (!job) throw Errors.notFound("Trabajo no encontrado.");
      return res.json({ job });
    } catch (e) {
      return next(e);
    }
  });

  router.delete("/jobs/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const jobId = asNumberId(req.params.id, "id");
      const deleted = await jobs.deleteForCompany(req.auth.id, jobId);
      if (!deleted) throw Errors.notFound("Trabajo no encontrado.");
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  });

  router.get("/applicants", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const queryJobId = req.query.jobId ? asNumberId(req.query.jobId, "jobId") : null;
      const query = optionalString(req.query.query ?? null, "query");
      const skills = optionalString(req.query.skills ?? null, "skills");
      const experience = optionalString(req.query.experience ?? null, "experience");
      const status = req.query.status ? oneOf(req.query.status, "status", ["submitted", "withdrawn", "rejected", "accepted"] as const) : null;
      const applicants = await jobs.listApplicantsForCompany(req.auth.id, { jobId: queryJobId, query, status, skills, experience });
      return res.json({ applicants });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/applicants/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const applicationId = asNumberId(req.params.id, "id");
      const detail = await jobs.getApplicantDetailForCompany(req.auth.id, applicationId);
      if (!detail) throw Errors.notFound("Postulación no encontrada.");
      return res.json(detail);
    } catch (e) {
      return next(e);
    }
  });

  router.put("/applicants/:id/status", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const applicationId = asNumberId(req.params.id, "id");
      const body = req.body ?? {};
      const status = oneOf(body.status, "status", ["submitted", "withdrawn", "rejected", "accepted"] as const);
      const updated = await jobs.updateApplicationStatusForCompany(req.auth.id, applicationId, status);
      if (!updated) throw Errors.notFound("Postulación no encontrada.");
      return res.json({ ok: true });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/applicants/:id/contact", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const applicationId = asNumberId(req.params.id, "id");
      const conversation = await jobs.openConversationForApplication(req.auth.id, applicationId);
      if (!conversation) throw Errors.notFound("Postulación no encontrada.");
      return res.status(201).json({ conversation });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/conversations", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const conversations = await jobs.listConversationsForCompany(req.auth.id);
      return res.json({ conversations });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/conversations/:id/messages", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const conversationId = asNumberId(req.params.id, "id");
      const conversation = await jobs.getConversationForCompany(req.auth.id, conversationId);
      if (!conversation) throw Errors.notFound("Conversación no encontrada.");
      const messages = await jobs.listMessagesForConversation(conversationId);
      return res.json({ conversation, messages });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/conversations/:id/messages", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const conversationId = asNumberId(req.params.id, "id");
      const conversation = await jobs.getConversationForCompany(req.auth.id, conversationId);
      if (!conversation) throw Errors.notFound("Conversación no encontrada.");
      const body = req.body ?? {};
      const message = await jobs.createMessageForConversation(conversationId, req.auth.id, {
        body: requiredString(body.body, "body"),
        attachmentName: optionalString(body.attachmentName, "attachmentName"),
        attachmentUrl: optionalString(body.attachmentUrl, "attachmentUrl"),
        scheduledInterviewAt: parseOptionalIsoDate(body.scheduledInterviewAt, "scheduledInterviewAt") ?? null,
      });
      return res.status(201).json({ message });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
