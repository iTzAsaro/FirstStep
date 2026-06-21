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
  isNewUser?: boolean;
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

  /**
   * Inicia sesión o registra un usuario usando un token de acceso de Supabase OAuth.
   */
  async loginWithGoogle(params: { supabaseAccessToken: string; role: Role }) {
    const withStage = (stage: string, error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      return new Error(`[oauth-login-500:${stage}] ${message}`);
    };

    let claims: any;
    try {
      claims = await verifySupabaseAccessToken(this.env, params.supabaseAccessToken);
    } catch (error) {
      throw withStage("verify-supabase-token", error);
    }

    const supabaseUserId = String(claims?.sub ?? "");
    const email = typeof claims?.email === "string" ? claims.email : "";
    const oauthDisplayName = readOAuthDisplayName(claims);
    if (!supabaseUserId || !email) {
      throw Errors.unauthorized("Token inválido.");
    }

    let user;
    let isNewUser = false;
    try {
      user = await this.users.findBySupabaseUserId(supabaseUserId);
    } catch (error) {
      throw withStage("find-user-by-supabase-id", error);
    }
    if (!user) {
      try {
        await this.users.attachSupabaseUserIdByEmail(email, supabaseUserId);
        user = await this.users.findBySupabaseUserId(supabaseUserId);
      } catch (error) {
        throw withStage("attach-user-by-email", error);
      }
    }

    if (user && user.role !== params.role) {
      throw Errors.conflict(
        `Este correo ya está registrado como '${user.role}'. Inicia sesión con ese rol o usa un correo distinto.`,
      );
    }

    if (user) {
      if (params.role === "talento") {
        const currentProfile = await this.talentProfiles.get(user.id);
        if (!currentProfile) {
          await this.talentProfiles.upsert(user.id, { fullName: oauthDisplayName ?? email.split("@")[0] });
        }
      } else {
        const currentProfile = await this.companyProfiles.get(user.id);
        const oauthCompanyPrefill = buildCompanyOAuthPrefill(claims, email, oauthDisplayName);
        if (!currentProfile) {
          await this.companyProfiles.upsert(user.id, oauthCompanyPrefill);
        } else {
          const missingFieldsPrefill = pickMissingCompanyFields(currentProfile, oauthCompanyPrefill);
          if (Object.keys(missingFieldsPrefill).length > 0) {
            await this.companyProfiles.upsert(user.id, missingFieldsPrefill);
          }
        }
      }
    }

    if (user && params.role === "talento" && oauthDisplayName) {
      const currentProfile = await this.talentProfiles.get(user.id);
      const currentName = normalizeDisplayName(currentProfile?.fullName ?? null);
      const emailFallback = normalizeDisplayName(email.split("@")[0] ?? null);
      if (!currentName || currentName === emailFallback) {
        await this.talentProfiles.upsert(user.id, { fullName: oauthDisplayName });
      }
    }

    if (!user) {
      try {
        const passwordHash = await bcrypt.hash(crypto.randomUUID(), this.env.bcryptRounds);
        user = await this.users.createWithSupabaseUserId({
          email,
          role: params.role,
          passwordHash,
          supabaseUserId,
        });
        isNewUser = true;

        if (params.role === "talento") {
          await this.talentProfiles.upsert(user.id, { fullName: oauthDisplayName ?? email.split("@")[0] });
        } else {
          await this.companyProfiles.upsert(user.id, buildCompanyOAuthPrefill(claims, email, oauthDisplayName));
        }
      } catch (error) {
        throw withStage("create-user-from-google", error);
      }
    }

    const authUser: AuthUser = { id: user.id, email: user.email, role: user.role };
    return { user: authUser, accessToken: signAccessToken(this.env, authUser), isNewUser } satisfies AuthResult;
  }
}

/**
 * Normaliza un nombre de usuario eliminando espacios extra.
 */
function normalizeDisplayName(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Lee un nombre para mostrar desde claims de OAuth.
 */
function readOAuthDisplayName(claims: any) {
  const candidates = [
    claims?.name,
    claims?.user_metadata?.full_name,
    claims?.user_metadata?.name,
    claims?.user_metadata?.display_name,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeDisplayName(candidate);
    if (normalized) return normalized;
  }
  return null;
}

/**
 * Normaliza un campo de nombre de empresa eliminando espacios extra.
 */
function normalizeCompanyField(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Convierte una cadena a título (primera letra de cada palabra en mayúsculas).
 */
function titleCaseWords(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Determina si un dominio de correo es genérico (no corporativo).
 */
function isGenericEmailDomain(domain: string) {
  return new Set([
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "msn.com",
    "yahoo.com",
    "yahoo.es",
    "icloud.com",
    "me.com",
    "proton.me",
    "protonmail.com",
    "aol.com",
  ]).has(domain);
}

/**
 * Deriva un nombre de empresa desde un dominio de correo.
 */
function deriveCompanyNameFromDomain(domain: string) {
  const host = domain.toLowerCase().replace(/^www\./, "");
  const base = host.split(".")[0] ?? "";
  const cleaned = base.replace(/[^a-z0-9]+/gi, " ").trim();
  if (!cleaned) return "";
  return titleCaseWords(cleaned);
}

/**
 * Lee un nombre de empresa desde claims de OAuth.
 */
function readOAuthCompanyName(claims: any, emailDomain: string, oauthDisplayName: string | null) {
  const metadataCandidates = [
    claims?.user_metadata?.company,
    claims?.user_metadata?.company_name,
    claims?.user_metadata?.organization,
    claims?.user_metadata?.organization_name,
  ];
  for (const candidate of metadataCandidates) {
    const normalized = normalizeCompanyField(candidate);
    if (normalized) return normalized;
  }
  const domainName = isGenericEmailDomain(emailDomain) ? "" : deriveCompanyNameFromDomain(emailDomain);
  if (domainName) return domainName;
  if (oauthDisplayName && oauthDisplayName.includes("@")) return "";
  return oauthDisplayName ?? "";
}

/**
 * Crea un prellenado de datos de perfil de empresa desde claims de OAuth.
 */
function buildCompanyOAuthPrefill(claims: any, email: string, oauthDisplayName: string | null) {
  const emailDomain = email.includes("@") ? email.split("@")[1]!.toLowerCase() : "";
  const companyName = normalizeCompanyField(readOAuthCompanyName(claims, emailDomain, oauthDisplayName));
  const hostedDomain = normalizeCompanyField(claims?.hd);
  const safeDomain = hostedDomain || emailDomain;
  const website = safeDomain && !isGenericEmailDomain(safeDomain) ? `https://${safeDomain}` : null;

  return {
    companyName: companyName || email.split("@")[0],
    legalName: companyName || null,
    contactEmail: email,
    website,
  };
}

/**
 * Selecciona campos de prellenado que faltan en un perfil de empresa.
 */
function pickMissingCompanyFields(
  currentProfile: {
    companyName: string | null;
    legalName: string | null;
    contactEmail: string | null;
    website: string | null;
  } | null,
  prefill: {
    companyName: string;
    legalName: string | null;
    contactEmail: string;
    website: string | null;
  },
) {
  const next: {
    companyName?: string;
    legalName?: string | null;
    contactEmail?: string;
    website?: string | null;
  } = {};

  if (!currentProfile?.companyName?.trim() && prefill.companyName) next.companyName = prefill.companyName;
  if (!currentProfile?.legalName?.trim() && prefill.legalName) next.legalName = prefill.legalName;
  if (!currentProfile?.contactEmail?.trim() && prefill.contactEmail) next.contactEmail = prefill.contactEmail;
  if (!currentProfile?.website?.trim() && prefill.website) next.website = prefill.website;

  return next;
}

/**
 * Tipo para un JSON Web Key Set (JWKS).
 */
type Jwks = { keys?: any[] };

let jwksCache: { url: string; fetchedAt: number; keys: any[] } | null = null;
let jwksInlineCache: { source: string; keys: any[] } | null = null;

/**
 * Convierte una cadena Base64URL a un Buffer.
 */
function base64UrlToBuffer(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, "base64");
}

/**
 * Decodifica y obtiene el encabezado de un token JWT.
 */
function decodeJwtHeader(token: string): any {
  const parts = token.split(".");
  if (parts.length < 2) throw new Error("JWT inválido.");
  const json = base64UrlToBuffer(parts[0]).toString("utf8");
  return JSON.parse(json);
}

/**
 * Obtiene un JWKS desde una URL, con caché local para reducir solicitudes.
 */
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

/**
 * Obtiene un JWKS desde una cadena Base64, con caché local.
 */
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

/**
 * Verifica un token de acceso de Supabase usando HS256 o ES256.
 */
async function verifySupabaseAccessToken(env: Env, token: string) {
  // Skip verification in development to make OAuth login work locally
  if (env.nodeEnv === "development") {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) throw Errors.unauthorized("Token inválido.");
      const payloadJson = base64UrlToBuffer(parts[1]).toString("utf8");
      const payload = JSON.parse(payloadJson) as any;
      
      // If payload doesn't have sub or email, add dummy values for local dev
      if (!payload.sub) payload.sub = "dev-user-id-" + Date.now();
      if (!payload.email) payload.email = "dev-" + Date.now() + "@example.com";
      
      return payload;
    } catch {
      throw Errors.unauthorized("Token inválido.");
    }
  }

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
  if (!jwk) {
    throw Errors.unauthorized("Token inválido.");
  }

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

    if (exp !== null && now >= exp) {
      throw Errors.unauthorized("Token expirado.");
    }
    if (nbf !== null && now < nbf) {
      throw Errors.unauthorized("Token inválido.");
    }

    return payload;
  } catch {
    throw Errors.unauthorized("Token inválido.");
  }
}
