// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     validators.ts                                           ║
// ║ Módulo:      backend/src/shared/validation                           ║
// ║ Descripción: Validadores simples para request bodies/params.         ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Errors } from "../http/middleware/errorHandler";

/**
 * Valida que el valor sea string (sin trim).
 */
export function asString(value: unknown, field: string) {
  if (typeof value !== "string") throw Errors.badRequest(`Campo '${field}' debe ser string.`);
  return value;
}

/**
 * Valida que el valor sea string y no esté vacío.
 */
export function requiredString(value: unknown, field: string) {
  const s = asString(value, field).trim();
  if (!s) throw Errors.badRequest(`Campo '${field}' es requerido.`);
  return s;
}

/**
 * Devuelve un string opcional (trim) o null.
 */
export function optionalString(value: unknown, field: string) {
  if (value === undefined || value === null) return null;
  return asString(value, field).trim();
}

/**
 * Valida email con una expresión regular simple.
 */
export function email(value: unknown, field: string) {
  const s = requiredString(value, field).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) throw Errors.badRequest(`Campo '${field}' no es un email válido.`);
  return s;
}

/**
 * Valida una contraseña básica.
 */
export function password(value: unknown, field: string) {
  const s = requiredString(value, field);
  if (s.length < 8) throw Errors.badRequest(`Campo '${field}' debe tener al menos 8 caracteres.`);
  return s;
}

/**
 * Valida que el valor sea uno de los permitidos.
 */
export function oneOf<T extends string>(value: unknown, field: string, options: readonly T[]): T {
  const s = requiredString(value, field) as T;
  if (!options.includes(s)) throw Errors.badRequest(`Campo '${field}' inválido. Opciones: ${options.join(", ")}.`);
  return s;
}

/**
 * Convierte y valida un id numérico (> 0).
 */
export function asNumberId(value: unknown, field: string) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw Errors.badRequest(`Campo '${field}' debe ser un id numérico válido.`);
  return n;
}
