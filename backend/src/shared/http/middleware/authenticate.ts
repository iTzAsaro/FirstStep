// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     authenticate.ts                                         ║
// ║ Módulo:      backend/src/shared/http/middleware                      ║
// ║ Descripción: Middleware que valida JWT y setea req.auth.             ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { NextFunction, Request, Response } from "express";

import type { Env } from "../../../config/env";
import { verifyAccessToken } from "../../../modules/auth/jwt";
import type { AuthUser } from "../types";

import { Errors } from "./errorHandler";

/**
 * Middleware de autenticación:
 * - Lee Authorization: Bearer <token>
 * - Verifica firma/expiración
 * - Expone el usuario en req.auth
 */
export function authenticate(env: Env) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const [kind, token] = header.split(" ");
    if (kind !== "Bearer" || !token) return next(Errors.unauthorized("Falta token Bearer."));

    try {
      const payload = verifyAccessToken(env, token);
      const user: AuthUser = { id: Number(payload.sub), role: payload.role, email: payload.email };
      if (!Number.isFinite(user.id)) return next(Errors.unauthorized("Token inválido."));
      req.auth = user;
      return next();
    } catch {
      return next(Errors.unauthorized("Token inválido o expirado."));
    }
  };
}
