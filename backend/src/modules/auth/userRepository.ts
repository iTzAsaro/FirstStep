// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     userRepository.ts                                       ║
// ║ Módulo:      backend/src/modules/auth                                ║
// ║ Descripción: Repositorio de usuarios (Oracle): queries y mutations.  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Db } from "../../shared/db/postgreSQL";
import type { Role } from "../../shared/http/types";

import type { User } from "./types";

export type CreateUserInput = {
  email: string;
  role: Role;
  passwordHash: string;
  acceptedTermsAt?: string | null;
  acceptedPrivacyAt?: string | null;
};

export type CreateUserWithSupabaseInput = CreateUserInput & {
  supabaseUserId: string;
};

/**
 * Repositorio de acceso a datos para usuarios.
 *
 * Encapsula SQL y mapeo de filas a tipos de dominio.
 */
export class UserRepository {
  constructor(private readonly db: Db) {}

  /**
   * Busca un usuario por email.
   */
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.db.queryOne<any>(
      `SELECT id,
              email,
              role,
              password_hash as "passwordHash",
              accepted_terms_at as "acceptedTermsAt",
              accepted_privacy_at as "acceptedPrivacyAt",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM users
       WHERE email = :email`,
      { email },
    );
    return row ?? null;
  }

  /**
   * Busca un usuario por id.
   */
  async findById(id: number): Promise<User | null> {
    const row = await this.db.queryOne<any>(
      `SELECT id,
              email,
              role,
              password_hash as "passwordHash",
              accepted_terms_at as "acceptedTermsAt",
              accepted_privacy_at as "acceptedPrivacyAt",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM users
       WHERE id = :id`,
      { id },
    );
    return row ?? null;
  }

  async findBySupabaseUserId(supabaseUserId: string): Promise<User | null> {
    const row = await this.db.queryOne<any>(
      `SELECT id,
              email,
              role,
              password_hash as "passwordHash",
              supabase_user_id as "supabaseUserId",
              accepted_terms_at as "acceptedTermsAt",
              accepted_privacy_at as "acceptedPrivacyAt",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM users
       WHERE supabase_user_id = :supabaseUserId`,
      { supabaseUserId },
    );
    return row ?? null;
  }

  async attachSupabaseUserIdByEmail(email: string, supabaseUserId: string) {
    await this.db.execute(
      `UPDATE users
       SET supabase_user_id = :supabaseUserId,
           updated_at = NOW()
       WHERE email = :email AND supabase_user_id IS NULL`,
      { email, supabaseUserId },
    );
  }

  /**
   * Crea un usuario y retorna el registro persistido.
   */
  async create(input: CreateUserInput): Promise<User> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO users (email, role, password_hash, accepted_terms_at, accepted_privacy_at)
       VALUES (:email, :role, :passwordHash, :acceptedTermsAt, :acceptedPrivacyAt)
       RETURNING id,
                 email,
                 role,
                 password_hash as "passwordHash",
                 accepted_terms_at as "acceptedTermsAt",
                 accepted_privacy_at as "acceptedPrivacyAt",
                 created_at as "createdAt",
                 updated_at as "updatedAt"`,
      {
        email: input.email,
        role: input.role,
        passwordHash: input.passwordHash,
        acceptedTermsAt: input.acceptedTermsAt ?? null,
        acceptedPrivacyAt: input.acceptedPrivacyAt ?? null,
      },
    );
    return row as User;
  }

  async createWithSupabaseUserId(input: CreateUserWithSupabaseInput): Promise<User> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO users (email, role, password_hash, supabase_user_id, accepted_terms_at, accepted_privacy_at)
       VALUES (:email, :role, :passwordHash, :supabaseUserId, :acceptedTermsAt, :acceptedPrivacyAt)
       RETURNING id,
                 email,
                 role,
                 password_hash as "passwordHash",
                 supabase_user_id as "supabaseUserId",
                 accepted_terms_at as "acceptedTermsAt",
                 accepted_privacy_at as "acceptedPrivacyAt",
                 created_at as "createdAt",
                 updated_at as "updatedAt"`,
      {
        email: input.email,
        role: input.role,
        passwordHash: input.passwordHash,
        supabaseUserId: input.supabaseUserId,
        acceptedTermsAt: input.acceptedTermsAt ?? null,
        acceptedPrivacyAt: input.acceptedPrivacyAt ?? null,
      },
    );
    return row as User;
  }
}
