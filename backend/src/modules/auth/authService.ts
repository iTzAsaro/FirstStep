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
  ) { }

  /**
   * Registra un usuario nuevo, crea el perfil asociado al rol y devuelve un JWT.
   */
  async register(params: {
    role: Role;
    email: string;
    password: string;
    displayName: string;
    acceptedTermsAt: string;
    acceptedPrivacyAt: string;
  }) {
    const existing = await this.users.findByEmail(params.email);
    if (existing) throw Errors.conflict("El email ya está registrado.");

    const passwordHash = await bcrypt.hash(params.password, this.env.bcryptRounds);
    const user = await this.users.create({
      email: params.email,
      role: params.role,
      passwordHash,
      acceptedTermsAt: params.acceptedTermsAt,
      acceptedPrivacyAt: params.acceptedPrivacyAt,
    });

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
    const claims = await verifySupabaseAccessToken(this.env, params.supabaseAccessToken);

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

    if (user && user.role !== params.role) {
      throw Errors.conflict(
        `Este correo ya está registrado como '${user.role}'. Inicia sesión con ese rol o usa un correo distinto.`,
      );
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

type Jwks = { keys?: any[] };

let jwksCache: { url: string; fetchedAt: number; keys: any[] } | null = null;
let jwksInlineCache: { source: string; keys: any[] } | null = null;

function base64UrlToBuffer(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64");
}

function decodeJwtHeader(token: string): any {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("JWT inválido.");
  const json = base64UrlToBuffer(parts[0]).toString("utf8");
  return JSON.parse(json);
}

async function getJwks(url: string) {
  const now = Date.now();
  const ttlMs = 10 * 60 * 1000;
  if (jwksCache && jwksCache.url === url && now - jwksCache.fetchedAt < ttlMs) return jwksCache.keys;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`No se pudo obtener JWKS. Detalle: ${msg}`);
  }
  if (!res.ok) throw new Error(`No se pudo obtener JWKS (${res.status}).`);
  const data = (await res.json()) as Jwks;
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache = { url, fetchedAt: now, keys };
  return keys;
}

function getInlineJwksFromBase64(base64Text: string) {
  const src = base64Text.trim();
  if (!src) return [];
  if (jwksInlineCache && jwksInlineCache.source === src) return jwksInlineCache.keys;
  let jsonText = "";
  try {
    jsonText = Buffer.from(src, "base64").toString("utf8");
    const parsed = JSON.parse(jsonText) as Jwks;
    const keys = Array.isArray(parsed.keys) ? parsed.keys : [];
    jwksInlineCache = { source: src, keys };
    return keys;
  } catch {
    throw new Error("SUPABASE_JWKS_BASE64 es inválido.");
  }
}

async function verifySupabaseAccessToken(env: Env, token: string) {
  const header = decodeJwtHeader(token);
  const alg = typeof header?.alg === "string" ? header.alg : "";
  const kid = typeof header?.kid === "string" ? header.kid : "";

  if (env.supabaseJwtSecret) {
    try {
      return jwt.verify(token, env.supabaseJwtSecret, { algorithms: ["HS256"] }) as any;
    } catch {
      throw Errors.unauthorized("Token inválido.");
    }
  }

  if (alg !== "ES256") {
    throw Errors.unauthorized("Token inválido.");
  }

  let keys: any[] = [];
  try {
    if (env.supabaseJwksBase64) {
      keys = getInlineJwksFromBase64(env.supabaseJwksBase64);
    } else if (env.supabaseJwksUrl) {
      keys = await getJwks(env.supabaseJwksUrl);
    } else {
      throw Errors.badRequest("Falta SUPABASE_JWKS_BASE64 (o SUPABASE_JWKS_URL / SUPABASE_JWT_SECRET) en el backend.");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw Errors.badRequest(msg);
  }
  const jwk = keys.find((k) => typeof k?.kid === "string" && k.kid === kid);
  if (!jwk) throw Errors.unauthorized("Token inválido.");

  let keyObj: crypto.KeyObject;
  try {
    keyObj = crypto.createPublicKey({ key: jwk, format: "jwk" as any });
  } catch {
    throw Errors.unauthorized("Token inválido.");
  }

  try {
    const parts = token.split(".");
    if (parts.length !== 3) throw Errors.unauthorized("Token inválido.");

    const signingInput = `${parts[0]}.${parts[1]}`;
    const signature = base64UrlToBuffer(parts[2]);
    const ok = crypto.verify("sha256", Buffer.from(signingInput), { key: keyObj, dsaEncoding: "ieee-p1363" }, signature);
    if (!ok) throw Errors.unauthorized("Token inválido.");

    const payloadJson = base64UrlToBuffer(parts[1]).toString("utf8");
    const payload = JSON.parse(payloadJson) as any;

    const now = Math.floor(Date.now() / 1000);
    const exp = typeof payload?.exp === "number" ? payload.exp : null;
    const nbf = typeof payload?.nbf === "number" ? payload.nbf : null;

    if (exp !== null && now >= exp) throw Errors.unauthorized("Token expirado.");
    if (nbf !== null && now < nbf) throw Errors.unauthorized("Token inválido.");

    return payload;
  } catch {
    throw Errors.unauthorized("Token inválido.");
  }
}
