// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      backend/src/modules/company                             ║
// ║ Descripción: Tipos de dominio para perfil de empresa.                ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Perfil de empresa persistido.
 */
export type CompanyProfile = {
  userId: number;
  companyName: string | null;
  legalName: string | null;
  taxId: string | null;
  companySize: string | null;
  industry: string | null;
  activitySector: string | null;
  location: string | null;
  website: string | null;
  description: string | null;
  verificationStatus: "pending" | "verified";
  verificationAcknowledgedAt: string | null;
  acceptedCompanyTermsAt: string | null;
  createdAt: string;
  updatedAt: string;
};
