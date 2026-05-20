// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     requireRole.ts                                          ║
// ║ Módulo:      backend/src/shared/http/middleware                      ║
// ║ Descripción: Middleware para restringir acceso según rol.            ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { NextFunction, Request, Response } from "express";

import type { Role } from "../types";

import { Errors } from "./errorHandler";

/**
 * Middleware de autorización por rol.
 */
export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(Errors.unauthorized());
    if (req.auth.role !== role) return next(Errors.forbidden());
    return next();
  };
}
