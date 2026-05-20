// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     talent.ts                                               ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Endpoints para perfil de talento (protegido por rol).   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { TalentProfileRepository } from "../modules/talent/talentProfileRepository";
import { authenticate } from "../shared/http/middleware/authenticate";
import { requireRole } from "../shared/http/middleware/requireRole";
import { Errors } from "../shared/http/middleware/errorHandler";
import { optionalString } from "../shared/validation/validators";

/**
 * Rutas de talento:
 * - GET /profile
 * - PUT /profile
 *
 * Requiere JWT y rol "talento".
 */
export function createTalentRouter(ctx: AppContext) {
  const router = Router();
  const repo = new TalentProfileRepository(ctx.db);

  router.use(authenticate(ctx.env), requireRole("talento"));

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
        fullName: optionalString(body.fullName, "fullName"),
        headline: optionalString(body.headline, "headline"),
        location: optionalString(body.location, "location"),
        phone: optionalString(body.phone, "phone"),
        linkedin: optionalString(body.linkedin, "linkedin"),
        github: optionalString(body.github, "github"),
        portfolio: optionalString(body.portfolio, "portfolio"),
      });
      return res.json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
