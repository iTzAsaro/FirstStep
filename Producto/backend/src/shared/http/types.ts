// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      backend/src/shared/http                                 ║
// ║ Descripción: Tipos HTTP compartidos (roles y usuario autenticado).   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Roles soportados por el sistema.
 */
export type Role = "talento" | "empresa";

/**
 * Usuario autenticado extraído del JWT.
 */
export type AuthUser = {
  id: number;
  role: Role;
  email: string;
};

/**
 * Extiende Express.Request para exponer el usuario autenticado.
 */
declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export {};
