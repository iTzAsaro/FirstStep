// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     storage.ts                                              ║
// ║ Módulo:      frontend/src/shared/lib                                 ║
// ║ Descripción: Utilidades de persistencia en localStorage (JSON).       ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Lee un valor JSON desde localStorage.
 * Devuelve null si no existe o si el parse falla.
 */
export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Escribe un objeto como JSON en localStorage.
 */
export function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Elimina una clave de localStorage.
 */
export function removeItem(key: string) {
  localStorage.removeItem(key);
}
