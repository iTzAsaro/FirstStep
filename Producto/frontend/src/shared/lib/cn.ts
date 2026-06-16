// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     cn.ts                                                   ║
// ║ Módulo:      frontend/src/shared/lib                                 ║
// ║ Descripción: Helper para componer className (Tailwind).               ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Concatena clases ignorando valores falsy.
 */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
