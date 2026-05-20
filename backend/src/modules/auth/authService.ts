// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     authService.ts                                          ║
// ║ Módulo:      backend/src/modules/auth                                ║
// ║ Descripción: Servicio de autenticación (registro/login) con JWT.     ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import type { Env } from "../../config/env";
import { Errors } from "../../shared/http/middleware/errorHandler";
import type { AuthUser, Role } from "../../shared/http/types";

import { signAccessToken } from "./jwt";
import type { CompanyProfileRepository } from "../company/companyProfileRepository";
import type { TalentProfileRepository } from "../talent/talentProfileRepository";
import { UserRepository } from "./userRepository";

export type AuthResult = {
  user: AuthUser;
  accessToken: string;
};

/**
 * Servicio de autenticación.
 *
 * Responsabilidades:
 * - Registrar usuarios por rol (talento/empresa).
 * - Validar credenciales y emitir tokens JWT.
 */
export class AuthService {
  constructor(
    private readonly env: Env,
    private readonly users: UserRepository,
    private readonly talentProfiles: TalentProfileRepository,
    private readonly companyProfiles: CompanyProfileRepository,
  ) {}

  /**
   * Registra un usuario nuevo, crea el perfil asociado al rol y devuelve un JWT.
   */
  async register(params: { role: Role; email: string; password: string; displayName: string }) {
    const existing = await this.users.findByEmail(params.email);
    if (existing) throw Errors.conflict("El email ya está registrado.");

    const passwordHash = await bcrypt.hash(params.password, this.env.bcryptRounds);
    const user = await this.users.create({ email: params.email, role: params.role, passwordHash });

    if (params.role === "talento") {
      await this.talentProfiles.upsert(user.id, { fullName: params.displayName });
    } else {
      await this.companyProfiles.upsert(user.id, { companyName: params.displayName });
    }

    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
    return { user: authUser, accessToken: signAccessToken(this.env, authUser) } satisfies AuthResult;
  }

  /**
   * Valida credenciales y devuelve un JWT.
   */
  async login(params: { email: string; password: string }) {
    const user = await this.users.findByEmail(params.email);
    if (!user) throw Errors.unauthorized("Credenciales inválidas.");

    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw Errors.unauthorized("Credenciales inválidas.");

    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
    return { user: authUser, accessToken: signAccessToken(this.env, authUser) } satisfies AuthResult;
  }

  async loginWithGoogle(params: { supabaseAccessToken: string; role: Role }) {
    const supabaseSecret = this.env.supabaseJwtSecret;
    if (!supabaseSecret) {
      throw Errors.badRequest("Falta SUPABASE_JWT_SECRET en el backend.");
    }

    let claims: any;
    try {
      claims = jwt.verify(params.supabaseAccessToken, supabaseSecret, { algorithms: ["HS256"] });
    } catch {
      throw Errors.unauthorized("Token inválido.");
    }

    const supabaseUserId = String(claims?.sub ?? "");
    const email = typeof claims?.email === "string" ? claims.email : "";
    if (!supabaseUserId || !email) {
      throw Errors.unauthorized("Token inválido.");
    }

    let user = await this.users.findBySupabaseUserId(supabaseUserId);
    if (!user) {
      await this.users.attachSupabaseUserIdByEmail(email, supabaseUserId);
      user = await this.users.findBySupabaseUserId(supabaseUserId);
    }

    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomUUID(), this.env.bcryptRounds);
      user = await this.users.createWithSupabaseUserId({
        email,
        role: params.role,
        passwordHash,
        supabaseUserId,
      });

      if (params.role === "talento") {
        await this.talentProfiles.upsert(user.id, { fullName: email.split("@")[0] });
      } else {
        await this.companyProfiles.upsert(user.id, { companyName: email.split("@")[0] });
      }
    }

    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
    return { user: authUser, accessToken: signAccessToken(this.env, authUser) } satisfies AuthResult;
  }
}
