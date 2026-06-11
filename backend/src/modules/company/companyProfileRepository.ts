// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     companyProfileRepository.ts                             ║
// ║ Módulo:      backend/src/modules/company                             ║
// ║ Descripción: Repositorio del perfil de empresa (Oracle).             ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Db } from "../../shared/db/postgreSQL";

import type { CompanyProfile } from "./types";

export type UpsertCompanyProfileInput = Partial<
  Pick<
    CompanyProfile,
    | "companyName"
    | "legalName"
    | "taxId"
    | "companySize"
    | "industry"
    | "activitySector"
    | "location"
    | "address"
    | "contactEmail"
    | "website"
    | "description"
    | "verificationStatus"
    | "verificationAcknowledgedAt"
    | "acceptedCompanyTermsAt"
  >
>;

/**
 * Repositorio de perfil de empresa.
 *
 * Expone lectura y upsert del perfil asociado al user_id (empresa).
 */
export class CompanyProfileRepository {
  constructor(private readonly db: Db) {}

  /**
   * Obtiene el perfil de empresa por userId.
   */
  async get(userId: number): Promise<CompanyProfile | null> {
    const row = await this.db.queryOne<any>(
      `SELECT user_id as "userId",
              company_name as "companyName",
              legal_name as "legalName",
              tax_id as "taxId",
              company_size as "companySize",
              industry,
              activity_sector as "activitySector",
              location,
              address,
              contact_email as "contactEmail",
              website,
              description,
              verification_status as "verificationStatus",
              verification_acknowledged_at as "verificationAcknowledgedAt",
              accepted_company_terms_at as "acceptedCompanyTermsAt",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM company_profiles
       WHERE user_id = :userId`,
      { userId },
    );
    return row ?? null;
  }

  /**
   * Inserta o actualiza el perfil de empresa.
   * Mantiene valores existentes si no se envían en el input.
   */
  async upsert(userId: number, input: UpsertCompanyProfileInput) {
    const current = (await this.get(userId)) ?? null;
    const next = {
      companyName: input.companyName ?? current?.companyName ?? null,
      legalName: input.legalName ?? current?.legalName ?? null,
      taxId: input.taxId ?? current?.taxId ?? null,
      companySize: input.companySize ?? current?.companySize ?? null,
      industry: input.industry ?? current?.industry ?? null,
      activitySector: input.activitySector ?? current?.activitySector ?? null,
      location: input.location ?? current?.location ?? null,
      address: input.address ?? current?.address ?? null,
      contactEmail: input.contactEmail ?? current?.contactEmail ?? null,
      website: input.website ?? current?.website ?? null,
      description: input.description ?? current?.description ?? null,
      verificationStatus: input.verificationStatus ?? current?.verificationStatus ?? "pending",
      verificationAcknowledgedAt: input.verificationAcknowledgedAt ?? current?.verificationAcknowledgedAt ?? null,
      acceptedCompanyTermsAt: input.acceptedCompanyTermsAt ?? current?.acceptedCompanyTermsAt ?? null,
    };

    await this.db.execute(
      `INSERT INTO company_profiles
        (user_id, company_name, legal_name, tax_id, company_size, industry, activity_sector, location, address, contact_email, website, description, verification_status, verification_acknowledged_at, accepted_company_terms_at, created_at, updated_at)
       VALUES
        (:userId, :companyName, :legalName, :taxId, :companySize, :industry, :activitySector, :location, :address, :contactEmail, :website, :description, :verificationStatus, :verificationAcknowledgedAt, :acceptedCompanyTermsAt, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        legal_name = EXCLUDED.legal_name,
        tax_id = EXCLUDED.tax_id,
        company_size = EXCLUDED.company_size,
        industry = EXCLUDED.industry,
        activity_sector = EXCLUDED.activity_sector,
        location = EXCLUDED.location,
        address = EXCLUDED.address,
        contact_email = EXCLUDED.contact_email,
        website = EXCLUDED.website,
        description = EXCLUDED.description,
        verification_status = EXCLUDED.verification_status,
        verification_acknowledged_at = EXCLUDED.verification_acknowledged_at,
        accepted_company_terms_at = EXCLUDED.accepted_company_terms_at,
        updated_at = NOW()`,
      { userId, ...next },
    );

    return (await this.get(userId)) as CompanyProfile;
  }

  isOnboardingComplete(profile: CompanyProfile | null) {
    if (!profile) return false;
    return Boolean(
      profile.companyName &&
        profile.legalName &&
        profile.taxId &&
        profile.companySize &&
        profile.activitySector &&
        profile.location &&
        profile.address &&
        profile.contactEmail &&
        profile.description &&
        profile.verificationAcknowledgedAt &&
        profile.acceptedCompanyTermsAt,
    );
  }
}
