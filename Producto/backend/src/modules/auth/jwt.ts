// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     jwt.ts                                                  ║
// ║ Módulo:      backend/src/modules/auth                                ║
// ║ Descripción: Utilidades para firmar y verificar JWT de acceso.        ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import jwt from "jsonwebtoken";

import type { Env } from "../../config/env";
import type { AuthUser } from "../../shared/http/types";

export type JwtPayload = {
  sub: string;
  role: AuthUser["role"];
  email: string;
};

/**
 * Firma un token JWT de acceso para el usuario autenticado.
 */
export function signAccessToken(env: Env, user: AuthUser) {
  const payload: JwtPayload = { sub: String(user.id), role: user.role, email: user.email };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

/**
 * Verifica un token JWT y devuelve el payload tipado.
 */
export function verifyAccessToken(env: Env, token: string) {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
