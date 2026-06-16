// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     errorHandler.ts                                         ║
// ║ Módulo:      backend/src/shared/http/middleware                      ║
// ║ Descripción: Middleware de errores y fábrica de errores tipados.     ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { NextFunction, Request, Response } from "express";

import { AppError, isAppError } from "../../errors/AppError";

/**
 * Middleware global de manejo de errores.
 *
 * Convierte errores del dominio (AppError) y errores de parseo JSON
 * en respuestas JSON consistentes.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isAppError(err)) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }

  if (err instanceof SyntaxError) {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "JSON inválido." } });
  }

  const message = err instanceof Error ? err.message : String(err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  });
}

/**
 * Fábrica de errores HTTP comunes para reutilizar en rutas/servicios.
 */
export const Errors = {
  badRequest(message: string) {
    return new AppError({ status: 400, code: "BAD_REQUEST", message });
  },
  unauthorized(message = "No autorizado.") {
    return new AppError({ status: 401, code: "UNAUTHORIZED", message });
  },
  forbidden(message = "Acceso denegado.") {
    return new AppError({ status: 403, code: "FORBIDDEN", message });
  },
  notFound(message = "No encontrado.") {
    return new AppError({ status: 404, code: "NOT_FOUND", message });
  },
  conflict(message = "Conflicto.") {
    return new AppError({ status: 409, code: "CONFLICT", message });
  },
};
