// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      backend/src/modules/auth                                ║
// ║ Descripción: Tipos de dominio para usuario autenticable.             ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Role } from "../../shared/http/types";

/**
 * Usuario persistido en base de datos.
 */
export type User = {
  id: number;
  email: string;
  role: Role;
  passwordHash: string;
  supabaseUserId?: string | null;
  acceptedTermsAt?: string | null;
  acceptedPrivacyAt?: string | null;
  createdAt: string;
  updatedAt: string;
};
