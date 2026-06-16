// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     company.ts                                              ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Endpoints para perfil de empresa (protegido por rol).   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { AuthService } from "../modules/auth/authService";
import { UserRepository } from "../modules/auth/userRepository";
import { CompanyProfileRepository } from "../modules/company/companyProfileRepository";
import { JobRepository } from "../modules/jobs/jobRepository";
import { TalentProfileRepository } from "../modules/talent/talentProfileRepository";
import { authenticate } from "../shared/http/middleware/authenticate";
import { requireRole } from "../shared/http/middleware/requireRole";
import { Errors } from "../shared/http/middleware/errorHandler";
import { asNumberId, email, oneOf, optionalString, password, requiredString } from "../shared/validation/validators";

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
  const talentProfiles = new TalentProfileRepository(ctx.db);
  const auth = new AuthService(
    ctx.env,
    new UserRepository(ctx.db),
    talentProfiles,
    repo,
  );

  function normalizeRut(raw: string) {
    return raw.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
  }

  function isRutFormattedValid(raw: string) {
    const trimmed = raw.trim();
    return /^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/.test(trimmed);
  }

  function computeRutDv(bodyDigits: string) {
    let sum = 0;
    let multiplier = 2;
    for (let i = bodyDigits.length - 1; i >= 0; i--) {
      sum += Number(bodyDigits[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const mod = 11 - (sum % 11);
    if (mod === 11) return "0";
    if (mod === 10) return "K";
    return String(mod);
  }

  function validateRutOrThrow(rawRut: string) {
    if (!isRutFormattedValid(rawRut)) {
      throw Errors.badRequest("El RUT debe tener formato válido, por ejemplo 12.345.678-5.");
    }
    const rut = normalizeRut(rawRut);
    const match = rut.match(/^(\d{7,8})-([\dK])$/);
    if (!match) {
      throw Errors.badRequest("El RUT debe tener formato válido, por ejemplo 12.345.678-5.");
    }
    const bodyDigits = match[1];
    const dv = match[2];
    const expected = computeRutDv(bodyDigits);
    if (dv !== expected) {
      throw Errors.badRequest("El RUT no es válido.");
    }
    return rut;
  }

  router.post("/register", async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const userEmail = email(body.email, "email");
      const userPassword = password(body.password, "password");
      const displayName = optionalString(body.companyName, "companyName") || userEmail.split("@")[0];
      const companySize = optionalString(body.companySize, "companySize");
      const acceptedTerms = body.acceptedTerms === true;
      const acceptedPrivacy = body.acceptedPrivacy === true;
      if (!acceptedTerms || !acceptedPrivacy) {
        throw Errors.badRequest("Debes aceptar los Términos y la Política de Privacidad.");
      }
      const now = new Date().toISOString();
      const out = await auth.register({
        role: "empresa",
        email: userEmail,
        password: userPassword,
        displayName,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      });
      await repo.upsert(Number(out.user.id), { companyName: displayName, companySize });
      return res.status(201).json({ ...out, onboardingCompleted: false });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const userEmail = email(body.email, "email");
      const userPassword = requiredString(body.password, "password");
      const out = await auth.login({ email: userEmail, password: userPassword });
      if (out.user.role !== "empresa") {
        throw Errors.unauthorized("Esta cuenta no corresponde al acceso empresarial.");
      }
      const profile = await repo.get(out.user.id);
      return res.json({ ...out, onboardingCompleted: repo.isOnboardingComplete(profile) });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/login/oauth", async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
      if (!token) throw Errors.unauthorized();
      const out = await auth.loginWithGoogle({ supabaseAccessToken: token, role: "empresa" });
      const profile = await repo.get(out.user.id);
      return res.json({ ...out, onboardingCompleted: repo.isOnboardingComplete(profile) });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/directory", authenticate(ctx.env), requireRole("talento"), async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const query = optionalString(req.query.query ?? null, "query");
      const industry = optionalString(req.query.industry ?? null, "industry");
      const location = optionalString(req.query.location ?? null, "location");
      const companySize = optionalString(req.query.companySize ?? null, "companySize");
      const verifiedRaw = optionalString(req.query.verified ?? null, "verified");
      const pageRaw = optionalString(req.query.page ?? null, "page");
      const pageSizeRaw = optionalString(req.query.pageSize ?? null, "pageSize");

      const page = pageRaw ? Number(pageRaw) : 1;
      const pageSize = pageSizeRaw ? Number(pageSizeRaw) : 12;
      if (!Number.isFinite(page) || !Number.isInteger(page) || page < 1) throw Errors.badRequest("Parámetro 'page' inválido.");
      if (!Number.isFinite(pageSize) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        throw Errors.badRequest("Parámetro 'pageSize' inválido.");
      }
      const verified =
        verifiedRaw === null || verifiedRaw === undefined || verifiedRaw === ""
          ? null
          : verifiedRaw === "true" || verifiedRaw === "1"
            ? true
            : verifiedRaw === "false" || verifiedRaw === "0"
              ? false
              : null;

      const out = await repo.listPublic({ query, industry, location, companySize, verified, page, pageSize });
      return res.json({ items: out.items, total: out.total, page, pageSize });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/directory/:id", authenticate(ctx.env), requireRole("talento"), async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const companyUserId = asNumberId(req.params.id, "id");
      const company = await repo.getPublic(companyUserId);
      if (!company) throw Errors.notFound("Empresa no encontrada.");
      return res.json({ company });
    } catch (e) {
      return next(e);
    }
  });

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

  router.delete("/account", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      await ctx.db.execute(`DELETE FROM users WHERE id = :id AND role = 'empresa'`, { id: req.auth.id });
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  });

  router.get("/talentos", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const query = optionalString(req.query.query ?? null, "query");
      const pageRaw = optionalString(req.query.page ?? null, "page");
      const pageSizeRaw = optionalString(req.query.pageSize ?? null, "pageSize");
      const page = pageRaw ? Number(pageRaw) : 1;
      const pageSize = pageSizeRaw ? Number(pageSizeRaw) : 12;
      if (!Number.isFinite(page) || !Number.isInteger(page) || page < 1) throw Errors.badRequest("Parámetro 'page' inválido.");
      if (!Number.isFinite(pageSize) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
        throw Errors.badRequest("Parámetro 'pageSize' inválido.");
      }
      const q = query?.trim() ? `%${query.trim().toLowerCase()}%` : null;
      const countRow = await ctx.db.queryOne<any>(
        `SELECT COUNT(*)::int as count
         FROM users u
         JOIN talent_profiles tp ON tp.user_id = u.id
         WHERE u.role = 'talento'
           AND tp.company_user_id = :companyUserId
           AND (:q::text IS NULL OR LOWER(tp.full_name) LIKE :q OR LOWER(tp.headline) LIKE :q OR LOWER(tp.location) LIKE :q)`,
        { companyUserId: req.auth.id, q },
      );
      const total = Number(countRow?.count ?? 0);
      const offset = (page - 1) * pageSize;
      const items = await ctx.db.queryMany<any>(
        `SELECT u.id::text as id,
                tp.full_name as "fullName",
                tp.headline,
                tp.location,
                tp.updated_at as "updatedAt"
         FROM users u
         JOIN talent_profiles tp ON tp.user_id = u.id
         WHERE u.role = 'talento'
           AND tp.company_user_id = :companyUserId
           AND (:q::text IS NULL OR LOWER(tp.full_name) LIKE :q OR LOWER(tp.headline) LIKE :q OR LOWER(tp.location) LIKE :q)
         ORDER BY tp.updated_at DESC
         LIMIT :limit OFFSET :offset`,
        { companyUserId: req.auth.id, q, limit: pageSize, offset },
      );
      return res.json({ items, total, page, pageSize });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/talentos/:id/asignar", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const talentUserId = asNumberId(req.params.id, "id");
      const user = await ctx.db.queryOne<any>(`SELECT role FROM users WHERE id = :id`, { id: talentUserId });
      if (!user) throw Errors.notFound("Talento no encontrado.");
      if (user.role !== "talento") throw Errors.badRequest("El usuario no corresponde a un talento.");
      const profile = await talentProfiles.upsert(talentUserId, { companyUserId: req.auth.id });
      return res.status(201).json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  router.delete("/talentos/:id/asignar", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const talentUserId = asNumberId(req.params.id, "id");
      const user = await ctx.db.queryOne<any>(`SELECT role FROM users WHERE id = :id`, { id: talentUserId });
      if (!user) throw Errors.notFound("Talento no encontrado.");
      if (user.role !== "talento") throw Errors.badRequest("El usuario no corresponde a un talento.");
      const profile = await talentProfiles.upsert(talentUserId, { companyUserId: null });
      return res.json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/validate-rut", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const rut = requiredString(body.rut, "rut");
      const normalized = validateRutOrThrow(rut);
      return res.json({
        valid: true,
        rut: normalized,
      });
    } catch (e) {
      return next(e);
    }
  });

  router.put("/profile", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const contactEmail = body.contactEmail === undefined ? undefined : body.contactEmail === null ? null : email(body.contactEmail, "contactEmail");
      const taxId = body.taxId === undefined ? undefined : body.taxId === null ? null : validateRutOrThrow(requiredString(body.taxId, "taxId"));
      const profile = await repo.upsert(req.auth.id, {
        companyName: optionalString(body.companyName, "companyName"),
        legalName: optionalString(body.legalName, "legalName"),
        taxId,
        companySize: optionalString(body.companySize, "companySize"),
        industry: optionalString(body.industry, "industry"),
        activitySector: optionalString(body.activitySector, "activitySector"),
        location: optionalString(body.location, "location"),
        address: optionalString(body.address, "address"),
        contactEmail,
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
      const rawRut = requiredString(body.taxId, "taxId");
      const validatedRut = validateRutOrThrow(rawRut);

      const profile = await repo.upsert(req.auth.id, {
        companyName: requiredString(body.companyName, "companyName"),
        legalName: requiredString(body.legalName, "legalName"),
        taxId: validatedRut,
        companySize: requiredString(body.companySize, "companySize"),
        industry: requiredString(body.industry, "industry"),
        activitySector: requiredString(body.activitySector, "activitySector"),
        location: requiredString(body.location, "location"),
        address: requiredString(body.address, "address"),
        contactEmail: email(body.contactEmail, "contactEmail"),
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
