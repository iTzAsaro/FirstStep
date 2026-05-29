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

  router.get("/profile", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const profile = await repo.get(req.auth.id);
      return res.json({ profile });
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
        companySize: optionalString(body.companySize, "companySize"),
        industry: optionalString(body.industry, "industry"),
        website: optionalString(body.website, "website"),
        description: optionalString(body.description, "description"),
      });
      return res.json({ profile });
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
      const location = optionalString(body.location, "location");
      const employmentType = oneOf(body.employmentType ?? "full_time", "employmentType", [
        "full_time",
        "part_time",
        "contract",
        "internship",
      ] as const);
      const seniority = oneOf(body.seniority ?? "junior", "seniority", ["junior", "mid", "senior"] as const);
      const salaryMin = parseOptionalInt(body.salaryMin, "salaryMin");
      const salaryMax = parseOptionalInt(body.salaryMax, "salaryMax");
      if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
        throw Errors.badRequest("Campo 'salaryMin' no puede ser mayor que 'salaryMax'.");
      }

      const job = await jobs.create(req.auth.id, {
        title,
        description,
        location,
        employmentType,
        seniority,
        salaryMin,
        salaryMax,
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
      const parseOptionalInt = (value: unknown, field: string) => {
        if (value === undefined) return undefined;
        if (value === null || value === "") return null;
        const n = Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw Errors.badRequest(`Campo '${field}' es inválido.`);
        return n;
      };

      const input: any = {};

      if (body.title !== undefined) input.title = requiredString(body.title, "title");
      if (body.description !== undefined) input.description = requiredString(body.description, "description");
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
      if (body.status !== undefined) input.status = oneOf(body.status, "status", ["active", "paused"] as const);

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

  return router;
}
