// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      backend/src/modules/talent                              ║
// ║ Descripción: Tipos de dominio para perfil de talento.                ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Perfil de talento persistido.
 */
export type TalentProfile = {
  userId: number;
  fullName: string | null;
  headline: string | null;
  location: string | null;
  phone: string | null;
  companyUserId: number | null;
  university: string | null;
  degree: string | null;
  gradYear: number | null;
  gpa: string | null;
  careerInterests: string[] | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  createdAt: string;
  updatedAt: string;
};
