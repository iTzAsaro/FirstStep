// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     auth.ts                                                 ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Rutas HTTP para registro/login y perfil del token (me). ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { AuthService } from "../modules/auth/authService";
import { UserRepository } from "../modules/auth/userRepository";
import { CompanyProfileRepository } from "../modules/company/companyProfileRepository";
import { TalentProfileRepository } from "../modules/talent/talentProfileRepository";
import { authenticate } from "../shared/http/middleware/authenticate";
import { Errors } from "../shared/http/middleware/errorHandler";
import { email, optionalString, password, requiredString } from "../shared/validation/validators";

export function createAuthRouter(ctx: AppContext) {
  const router = Router();
  const companyProfiles = new CompanyProfileRepository(ctx.db);
  const service = new AuthService(
    ctx.env,
    new UserRepository(ctx.db),
    new TalentProfileRepository(ctx.db),
    companyProfiles,
  );

  async function handleSupabaseLogin(req: any, roleRawFallback: string) {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
    if (!token) throw Errors.unauthorized();

    const body = req.body ?? {};
    const roleRaw = requiredString(body.role ?? roleRawFallback, "role");
    if (roleRaw !== "talento" && roleRaw !== "empresa") {
      throw Errors.badRequest("Rol inválido.");
    }

    return await service.loginWithGoogle({ supabaseAccessToken: token, role: roleRaw });
  }

  /**
   * Registro de talento.
   * Body: { email, password, fullName? }
   */
  router.post("/register/talent", async (req, res, next) => {
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
      const out = await service.register({
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
   * Registro de empresa.
   * Body: { email, password, companyName? }
   */
  router.post("/register/company", async (req, res, next) => {
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
      const out = await service.register({
        role: "empresa",
        email: userEmail,
        password: userPassword,
        displayName,
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
      });
      await companyProfiles.upsert(Number(out.user.id), { companyName: displayName, companySize });
      return res.status(201).json(out);
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Login genérico (talento o empresa según usuario).
   * Body: { email, password }
   */
  router.post("/login", async (req, res, next) => {
    try {
      const body = req.body ?? {};
      const userEmail = email(body.email, "email");
      const userPassword = requiredString(body.password, "password");
      const out = await service.login({ email: userEmail, password: userPassword });
      return res.json(out);
    } catch (e) {
      return next(e);
    }
  });

  router.post("/login/google", async (req, res, next) => {
    try {
      const out = await handleSupabaseLogin(req, "talento");
      return res.json(out);
    } catch (e) {
      return next(e);
    }
  });

  router.post("/login/linkedin", async (req, res, next) => {
    try {
      const out = await handleSupabaseLogin(req, "talento");
      return res.json(out);
    } catch (e) {
      return next(e);
    }
  });

  router.post("/login/oauth", async (req, res, next) => {
    try {
      const out = await handleSupabaseLogin(req, "talento");
      return res.json(out);
    } catch (e) {
      return next(e);
    }
  });

  /**
   * Devuelve el usuario del token actual.
   * Header: Authorization: Bearer <token>
   */
  router.get("/me", authenticate(ctx.env), async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      return res.json({ user: req.auth });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
