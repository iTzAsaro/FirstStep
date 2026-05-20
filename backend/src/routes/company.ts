// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     company.ts                                              ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Endpoints para perfil de empresa (protegido por rol).   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { CompanyProfileRepository } from "../modules/company/companyProfileRepository";
import { authenticate } from "../shared/http/middleware/authenticate";
import { requireRole } from "../shared/http/middleware/requireRole";
import { Errors } from "../shared/http/middleware/errorHandler";
import { optionalString } from "../shared/validation/validators";

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
        industry: optionalString(body.industry, "industry"),
        website: optionalString(body.website, "website"),
        description: optionalString(body.description, "description"),
      });
      return res.json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
