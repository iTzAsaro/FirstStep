// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     talentProfileRepository.ts                              ║
// ║ Módulo:      backend/src/modules/talent                              ║
// ║ Descripción: Repositorio del perfil de talento (Oracle).             ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Db } from "../../shared/db/postgreSQL";

import type { TalentProfile } from "./types";

export type UpsertTalentProfileInput = Partial<Pick<TalentProfile, "fullName" | "headline" | "location" | "phone" | "linkedin" | "github" | "portfolio">>;

/**
 * Repositorio de perfil de talento.
 *
 * Expone lectura y upsert del perfil asociado al user_id (talento).
 */
export class TalentProfileRepository {
  constructor(private readonly db: Db) {}

  /**
   * Obtiene el perfil de talento por userId.
   */
  async get(userId: number): Promise<TalentProfile | null> {
    const row = await this.db.queryOne<any>(
      `SELECT user_id as "userId",
              full_name as "fullName",
              headline,
              location,
              phone,
              linkedin,
              github,
              portfolio,
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM talent_profiles
       WHERE user_id = :userId`,
      { userId },
    );
    return row ?? null;
  }

  /**
   * Inserta o actualiza el perfil de talento.
   * Mantiene valores existentes si no se envían en el input.
   */
  async upsert(userId: number, input: UpsertTalentProfileInput) {
    const current = (await this.get(userId)) ?? null;
    const next = {
      fullName: input.fullName ?? current?.fullName ?? null,
      headline: input.headline ?? current?.headline ?? null,
      location: input.location ?? current?.location ?? null,
      phone: input.phone ?? current?.phone ?? null,
      linkedin: input.linkedin ?? current?.linkedin ?? null,
      github: input.github ?? current?.github ?? null,
      portfolio: input.portfolio ?? current?.portfolio ?? null,
    };

    await this.db.execute(
      `INSERT INTO talent_profiles
        (user_id, full_name, headline, location, phone, linkedin, github, portfolio, created_at, updated_at)
       VALUES
        (:userId, :fullName, :headline, :location, :phone, :linkedin, :github, :portfolio, NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        headline = EXCLUDED.headline,
        location = EXCLUDED.location,
        phone = EXCLUDED.phone,
        linkedin = EXCLUDED.linkedin,
        github = EXCLUDED.github,
        portfolio = EXCLUDED.portfolio,
        updated_at = NOW()`,
      { userId, ...next },
    );

    return (await this.get(userId)) as TalentProfile;
  }
}
