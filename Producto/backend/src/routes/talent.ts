// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     talent.ts                                               ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Endpoints para perfil de talento (protegido por rol).   ║
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
import { asNumberId, email, optionalString, password, requiredString } from "../shared/validation/validators";

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
  const jobs = new JobRepository(ctx.db);
  const auth = new AuthService(
    ctx.env,
    new UserRepository(ctx.db),
    repo,
    new CompanyProfileRepository(ctx.db),
  );

  /**
   * Verifica si el perfil de talento tiene el onboarding completo.
   */
  function isOnboardingComplete(profile: any) {
    const fullName = typeof profile?.fullName === "string" ? profile.fullName.trim() : "";
    const city = typeof profile?.location === "string" ? profile.location.trim() : "";
    const university = typeof profile?.university === "string" ? profile.university.trim() : "";
    const degree = typeof profile?.degree === "string" ? profile.degree.trim() : "";
    const gradYear = typeof profile?.gradYear === "number" ? profile.gradYear : null;
    const careers = Array.isArray(profile?.careerInterests) ? profile.careerInterests : [];
    return Boolean(fullName && city && university && degree && gradYear && careers.length >= 3);
  }

  /**
   * Registro de talento.
   */
  router.post("/register", async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const userEmail = email(body.email, "email");
      const userPassword = password(body.password, "password");
      const displayName = optionalString(body.fullName, "fullName") || userEmail.split("@")[0];
      const acceptedTerms = body.acceptedTerms === true;
      const acceptedPrivacy = body.acceptedPrivacy === true;
      if (!acceptedTerms || !acceptedPrivacy) {
        throw Errors.badRequest("Debes aceptar los Términos y la Política de Privacidad.");
      }
      const now = new Date().toISOString();
      const out = await auth.register({
        role: "talento",
        email: userEmail,
        password: userPassword,
        displayName,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      });
      return res.status(201).json(out);
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Login de talento.
   */
  router.post("/login", async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const userEmail = email(body.email, "email");
      const userPassword = requiredString(body.password, "password");
      const out = await auth.login({ email: userEmail, password: userPassword });
      if (out.user.role !== "talento") {
        throw Errors.unauthorized("Esta cuenta no corresponde al acceso de talento.");
      }
      const profile = await repo.get(out.user.id);
      return res.json({ ...out, onboardingCompleted: isOnboardingComplete(profile) });
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Login OAuth de talento (Supabase).
   */
  router.post("/login/oauth", async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : "";
      if (!token) throw Errors.unauthorized();
      const out = await auth.loginWithGoogle({ supabaseAccessToken: token, role: "talento" });
      const profile = await repo.get(out.user.id);
      return res.json({ ...out, onboardingCompleted: isOnboardingComplete(profile) });
    } catch (e) {
      return next(e);
    }
  });

  router.use(authenticate(ctx.env), requireRole("talento"));

  /**
   * Normaliza un arreglo de strings (trim y filtra vacíos).
   */
  function normalizeStringArray(value: unknown, field: string) {
    if (value === undefined || value === null) return null;
    if (!Array.isArray(value)) throw Errors.badRequest(`Campo '${field}' debe ser un arreglo.`);
    const items = value
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
    return items;
  }

  /**
   * Valida una URL opcional (solo http/https).
   */
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

  /**
   * Obtiene el perfil del talento autenticado.
   */
  router.get("/profile", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const profile = await repo.get(req.auth.id);
      return res.json({ profile });
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Obtiene el dashboard del talento (estadísticas y actividad).
   */
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

      return res.json({
        user: req.auth,
        profile,
        stats: {
          cvsCount: counts?.cvsCount ?? 0,
          aiSessionsCount: counts?.aiSessionsCount ?? 0,
          interviewsCount: counts?.interviewsCount ?? 0,
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

  /**
   * Actualiza el perfil del talento.
   */
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

  /**
   * Completa el onboarding del talento.
   */
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

  /**
   * Lista ofertas de trabajo activas para el talento.
   */
  router.get("/jobs", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const rows = await jobs.listActiveForTalent(req.auth.id);
      return res.json({ jobs: rows });
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Postula a una oferta de trabajo.
   */
  router.post("/jobs/:id/apply", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const jobId = asNumberId(req.params.id, "id");
      const body = req.body ?? {};
      const coverLetter = optionalString(body.coverLetter, "coverLetter");
      const application = await jobs.apply(jobId, req.auth.id, coverLetter);
      if (!application) {
        throw Errors.badRequest("No se puede postular a esta oportunidad (estado o fecha límite).");
      }
      return res.status(201).json({ application });
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Lista conversaciones del talento.
   */
  router.get("/conversations", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const conversations = await jobs.listConversationsForTalent(req.auth.id);
      return res.json({ conversations });
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Obtiene los mensajes de una conversación.
   */
  router.get("/conversations/:id/messages", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const conversationId = asNumberId(req.params.id, "id");
      const conversation = await jobs.getConversationForTalent(req.auth.id, conversationId);
      if (!conversation) throw Errors.notFound("Conversación no encontrada.");
      const messages = await jobs.listMessagesForConversation(conversationId);
      return res.json({ conversation, messages });
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Envía un mensaje en una conversación.
   */
  router.post("/conversations/:id/messages", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const conversationId = asNumberId(req.params.id, "id");
      const conversation = await jobs.getConversationForTalent(req.auth.id, conversationId);
      if (!conversation) throw Errors.notFound("Conversación no encontrada.");
      const body = req.body ?? {};
      const scheduledInterviewAtRaw = optionalString(body.scheduledInterviewAt, "scheduledInterviewAt");
      let scheduledInterviewAt: string | null = null;
      if (scheduledInterviewAtRaw) {
        const parsed = new Date(scheduledInterviewAtRaw);
        if (!Number.isFinite(parsed.getTime())) {
          throw Errors.badRequest("Campo 'scheduledInterviewAt' es inválido.");
        }
        scheduledInterviewAt = parsed.toISOString();
      }
      const message = await jobs.createMessageForConversation(conversationId, req.auth.id, {
        body: requiredString(body.body, "body"),
        attachmentName: optionalString(body.attachmentName, "attachmentName"),
        attachmentUrl: optionalString(body.attachmentUrl, "attachmentUrl"),
        scheduledInterviewAt,
      });
      return res.status(201).json({ message });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
