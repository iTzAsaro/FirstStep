// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     companyProfileRepository.ts                             ║
// ║ Módulo:      backend/src/modules/company                             ║
// ║ Descripción: Repositorio del perfil de empresa (Oracle).             ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Db } from "../../shared/db/postgreSQL";

import type { CompanyProfile } from "./types";

export type UpsertCompanyProfileInput = Partial<Pick<CompanyProfile, "companyName" | "companySize" | "industry" | "website" | "description">>;

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
              company_size as "companySize",
              industry,
              website,
              description,
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
      companySize: input.companySize ?? current?.companySize ?? null,
      industry: input.industry ?? current?.industry ?? null,
      website: input.website ?? current?.website ?? null,
      description: input.description ?? current?.description ?? null,
    };

    await this.db.execute(
      `INSERT INTO company_profiles
        (user_id, company_name, company_size, industry, website, description, created_at, updated_at)
       VALUES
        (:userId, :companyName, :companySize, :industry, :website, :description, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        company_size = EXCLUDED.company_size,
        industry = EXCLUDED.industry,
        website = EXCLUDED.website,
        description = EXCLUDED.description,
        updated_at = NOW()`,
      { userId, ...next },
    );

    return (await this.get(userId)) as CompanyProfile;
  }
}
