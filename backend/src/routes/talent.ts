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
import { optionalString, requiredString } from "../shared/validation/validators";

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

  function normalizeStringArray(value: unknown, field: string) {
    if (value === undefined || value === null) return null;
    if (!Array.isArray(value)) throw Errors.badRequest(`Campo '${field}' debe ser un arreglo.`);
    const items = value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
    return items;
  }

  function validateOptionalUrl(value: string | null, field: string) {
    if (!value) return null;
    try {
      const u = new URL(value);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
      return value;
    } catch {
      throw Errors.badRequest(`Campo '${field}' no es una URL válida.`);
    }
  }

  router.get("/profile", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const profile = await repo.get(req.auth.id);
      return res.json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/dashboard", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();

      const profile = await repo.get(req.auth.id);
      const counts = await ctx.db.queryOne<any>(
        `SELECT
            (SELECT COUNT(*)::int FROM cvs WHERE user_id = :userId) as "cvsCount",
            (SELECT COUNT(*)::int FROM ai_sessions WHERE user_id = :userId) as "aiSessionsCount",
            (SELECT COUNT(*)::int FROM ai_sessions WHERE user_id = :userId AND kind = 'interview') as "interviewsCount"`,
        { userId: req.auth.id },
      );

      const recentCvs = await ctx.db.queryMany<any>(
        `SELECT id::text as id, title, updated_at as "updatedAt"
         FROM cvs
         WHERE user_id = :userId
         ORDER BY updated_at DESC
         LIMIT 5`,
        { userId: req.auth.id },
      );

      const recentSessions = await ctx.db.queryMany<any>(
        `SELECT id::text as id, kind, title, model, updated_at as "updatedAt"
         FROM ai_sessions
         WHERE user_id = :userId
         ORDER BY updated_at DESC
         LIMIT 5`,
        { userId: req.auth.id },
      );

      const activity = await ctx.db.queryMany<any>(
        `SELECT source, ref_id as "refId", label, at
         FROM (
           SELECT 'cv'::text as source,
                  id::text as ref_id,
                  title as label,
                  updated_at as at
           FROM cvs
           WHERE user_id = :userId
           UNION ALL
           SELECT 'ai_session'::text as source,
                  id::text as ref_id,
                  title as label,
                  updated_at as at
           FROM ai_sessions
           WHERE user_id = :userId
           UNION ALL
           SELECT 'profile'::text as source,
                  user_id::text as ref_id,
                  'Perfil actualizado'::text as label,
                  updated_at as at
           FROM talent_profiles
           WHERE user_id = :userId
         ) t
         ORDER BY at DESC
         LIMIT 6`,
        { userId: req.auth.id },
      );

      const completeness = (() => {
        if (!profile) return 0;
        const fields: Array<unknown> = [
          profile.fullName,
          profile.location,
          profile.phone,
          profile.university,
          profile.degree,
          profile.gradYear,
          profile.gpa,
          (profile.careerInterests ?? []).length ? profile.careerInterests : null,
          profile.linkedin,
          profile.github,
          profile.portfolio,
          profile.headline,
        ];
        const filled = fields.filter((v) => {
          if (v === null || v === undefined) return false;
          if (typeof v === "string") return v.trim().length > 0;
          if (Array.isArray(v)) return v.length > 0;
          return true;
        }).length;
        return Math.round((filled / fields.length) * 100);
      })();

      return res.json({
        user: req.auth,
        profile,
        stats: {
          cvsCount: counts?.cvsCount ?? 0,
          aiSessionsCount: counts?.aiSessionsCount ?? 0,
          interviewsCount: counts?.interviewsCount ?? 0,
          profileCompleteness: completeness,
        },
        recent: {
          cvs: recentCvs,
          sessions: recentSessions,
        },
        activity,
      });
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
        linkedin: validateOptionalUrl(optionalString(body.linkedin, "linkedin"), "linkedin"),
        github: validateOptionalUrl(optionalString(body.github, "github"), "github"),
        portfolio: validateOptionalUrl(optionalString(body.portfolio, "portfolio"), "portfolio"),
      });
      return res.json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/onboarding", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};

      const fullName = requiredString(body.fullName, "fullName");
      const phone = optionalString(body.phone, "phone");
      const city = requiredString(body.city, "city");
      const university = requiredString(body.university, "university");
      const degree = requiredString(body.degree, "degree");
      const gradYearRaw = requiredString(body.gradYear, "gradYear");
      const gpaRaw = optionalString(body.gpa, "gpa");
      const careerInterests = normalizeStringArray(body.careerInterests, "careerInterests");

      const gradYear = Number(gradYearRaw);
      if (!Number.isInteger(gradYear) || gradYear < 1900 || gradYear > 2100) {
        throw Errors.badRequest("Campo 'gradYear' es inválido.");
      }

      let gpa: string | null = null;
      if (gpaRaw) {
        const n = Number(gpaRaw);
        if (!Number.isFinite(n) || n < 0 || n > 5) throw Errors.badRequest("Campo 'gpa' es inválido.");
        gpa = String(n);
      }

      if (!careerInterests || careerInterests.length < 3) {
        throw Errors.badRequest("Debes seleccionar al menos 3 opciones en 'careerInterests'.");
      }
      const dedupedCareers = Array.from(new Set(careerInterests));

      const profile = await repo.upsert(req.auth.id, {
        fullName,
        location: city,
        phone,
        university,
        degree,
        gradYear,
        gpa,
        careerInterests: dedupedCareers,
        headline: degree,
      });

      return res.status(201).json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
