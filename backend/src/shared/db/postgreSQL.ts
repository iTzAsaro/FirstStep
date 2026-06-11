// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     postgreSQL.ts                                           ║
// ║ Módulo:      backend/src/shared/db                                   ║
// ║ Descripción: Adaptador de base de datos PostgreSQL/Supabase.         ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Env } from "../../config/env";
import dns from "node:dns";
import postgres from "postgres";

// ── Forzar IPv4 en la resolución DNS ────────────────────────────────────
// Docker no tiene conectividad IPv6 por defecto. Sin esto, Node resuelve
// el hostname de Supabase a una dirección IPv6 (2600:1f18:...) y la
// conexión falla con ENETUNREACH.
dns.setDefaultResultOrder("ipv4first");

export type Db = {
  sql: any;
  execute<T = any>(sqlText: string, binds?: Record<string, any>): Promise<{ rows: T[] }>;
  queryOne<T = any>(sqlText: string, binds?: Record<string, any>): Promise<T | null>;
  queryMany<T = any>(sqlText: string, binds?: Record<string, any>): Promise<T[]>;
};

function resolveSslMode(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl);
    const host = url.hostname.trim().toLowerCase();
    if (["db", "localhost", "127.0.0.1"].includes(host)) return false;
  } catch {
    // Si la URL no se puede parsear, mantener el comportamiento seguro por defecto.
  }
  return "require" as const;
}

function compileNamedBinds(sqlText: string, binds: Record<string, any>) {
  const values: any[] = [];
  const nameToIndex = new Map<string, number>();
  const normalizedBinds = binds ?? {};

  const text = sqlText.replace(
    /(?<!:):([a-zA-Z_][a-zA-Z0-9_]*)/g,
    (_m, name: string) => {
      if (!(name in normalizedBinds)) {
        throw new Error(`Falta bind requerido :${name}`);
      }
      const existing = nameToIndex.get(name);
      if (existing) return `$${existing}`;
      const idx = values.length + 1;
      nameToIndex.set(name, idx);
      values.push(normalizedBinds[name]);
      return `$${idx}`;
    },
  );

  return { text, values };
}

/**
 * Inicializa el cliente PostgreSQL (Supabase) y expone helpers para ejecutar queries.
 *
 * Variables:
 * - DATABASE_URL
 * - DB_TEST_ON_STARTUP=true ejecuta `SELECT 1` al iniciar.
 */
export async function createDb(env: Env): Promise<Db> {
  if (!env.databaseUrl) throw new Error("Falta DATABASE_URL.");

  // Supabase remoto necesita TLS; el Postgres local de Docker no.
  const sql = postgres(env.databaseUrl, { ssl: resolveSslMode(env.databaseUrl) });

  if (env.dbTestOnStartup) {
    try {
      await sql`SELECT 1 AS value`;
      process.stdout.write("Postgres: conexión verificada correctamente.\n");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      process.stderr.write(`Postgres: fallo en prueba de conexión. Detalle: ${msg}\n`);
      throw e;
    }
  }

  try {
    await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ`, []);
    await sql.unsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMPTZ`, []);
  } catch { }

  try {
    await sql.unsafe(`ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS university VARCHAR(200)`, []);
    await sql.unsafe(`ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS degree VARCHAR(200)`, []);
    await sql.unsafe(`ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS grad_year INT`, []);
    await sql.unsafe(`ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS gpa NUMERIC(4, 2)`, []);
    await sql.unsafe(`ALTER TABLE talent_profiles ADD COLUMN IF NOT EXISTS career_interests TEXT[]`, []);
  } catch { }

  try {
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS company_size VARCHAR(50)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS legal_name VARCHAR(200)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS tax_id VARCHAR(120)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS industry VARCHAR(200)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS activity_sector VARCHAR(200)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS location VARCHAR(200)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS website VARCHAR(300)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS description VARCHAR(2000)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20)`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS verification_acknowledged_at TIMESTAMPTZ`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ADD COLUMN IF NOT EXISTS accepted_company_terms_at TIMESTAMPTZ`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles ALTER COLUMN verification_status SET DEFAULT 'pending'`, []);
    await sql.unsafe(`UPDATE company_profiles SET verification_status = 'pending' WHERE verification_status IS NULL`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS company_profiles DROP CONSTRAINT IF EXISTS company_profiles_verification_status_check`, []);
    await sql.unsafe(
      `ALTER TABLE IF EXISTS company_profiles
       ADD CONSTRAINT company_profiles_verification_status_check
       CHECK (verification_status IN ('pending', 'verified'))`,
      [],
    );
  } catch { }

  try {
    await sql.unsafe(`ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS requirements TEXT`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS benefits TEXT`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS jobs ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ`, []);
    await sql.unsafe(`ALTER TABLE IF EXISTS jobs DROP CONSTRAINT IF EXISTS jobs_status_check`, []);
    await sql.unsafe(
      `ALTER TABLE IF EXISTS jobs
       ADD CONSTRAINT jobs_status_check
       CHECK (status IN ('active', 'paused', 'closed'))`,
      [],
    );
    await sql.unsafe(`CREATE TABLE IF NOT EXISTS jobs (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      company_user_id BIGINT NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      requirements TEXT,
      benefits TEXT,
      location VARCHAR(200),
      employment_type VARCHAR(30) NOT NULL DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
      seniority VARCHAR(30) NOT NULL DEFAULT 'junior' CHECK (seniority IN ('junior', 'mid', 'senior')),
      salary_min INT,
      salary_max INT,
      application_deadline TIMESTAMPTZ,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed')),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT fk_jobs_company FOREIGN KEY (company_user_id) REFERENCES users (id) ON DELETE CASCADE
    )`, []);

    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_jobs_company_user_id ON jobs (company_user_id)`, []);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs (status, created_at DESC)`, []);

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS job_applications (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      job_id BIGINT NOT NULL,
      talent_user_id BIGINT NOT NULL,
      cover_letter TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'withdrawn', 'rejected', 'accepted')),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT fk_job_applications_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
      CONSTRAINT fk_job_applications_talent FOREIGN KEY (talent_user_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT uq_job_applications UNIQUE (job_id, talent_user_id)
    )`, []);

    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications (job_id)`, []);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_job_applications_talent_user_id ON job_applications (talent_user_id)`, []);

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS application_conversations (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      application_id BIGINT NOT NULL UNIQUE,
      company_user_id BIGINT NOT NULL,
      talent_user_id BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT fk_application_conversations_application FOREIGN KEY (application_id) REFERENCES job_applications (id) ON DELETE CASCADE,
      CONSTRAINT fk_application_conversations_company FOREIGN KEY (company_user_id) REFERENCES users (id) ON DELETE CASCADE,
      CONSTRAINT fk_application_conversations_talent FOREIGN KEY (talent_user_id) REFERENCES users (id) ON DELETE CASCADE
    )`, []);
    await sql.unsafe(
      `CREATE INDEX IF NOT EXISTS idx_application_conversations_company ON application_conversations (company_user_id, updated_at DESC)`,
      [],
    );
    await sql.unsafe(
      `CREATE INDEX IF NOT EXISTS idx_application_conversations_talent ON application_conversations (talent_user_id, updated_at DESC)`,
      [],
    );

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS conversation_messages (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      conversation_id BIGINT NOT NULL,
      sender_user_id BIGINT NOT NULL,
      body TEXT NOT NULL,
      attachment_name VARCHAR(255),
      attachment_url VARCHAR(500),
      scheduled_interview_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT fk_conversation_messages_conversation FOREIGN KEY (conversation_id) REFERENCES application_conversations (id) ON DELETE CASCADE,
      CONSTRAINT fk_conversation_messages_sender FOREIGN KEY (sender_user_id) REFERENCES users (id) ON DELETE CASCADE
    )`, []);
    await sql.unsafe(
      `CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation ON conversation_messages (conversation_id, created_at ASC)`,
      [],
    );

    await sql.unsafe(`CREATE TABLE IF NOT EXISTS conversation_files (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      conversation_id BIGINT NOT NULL,
      uploader_user_id BIGINT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(120) NOT NULL DEFAULT 'application/octet-stream',
      size_bytes INT NOT NULL,
      data BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      CONSTRAINT fk_conversation_files_conversation FOREIGN KEY (conversation_id) REFERENCES application_conversations (id) ON DELETE CASCADE,
      CONSTRAINT fk_conversation_files_uploader FOREIGN KEY (uploader_user_id) REFERENCES users (id) ON DELETE CASCADE
    )`, []);
    await sql.unsafe(
      `CREATE INDEX IF NOT EXISTS idx_conversation_files_conversation_id ON conversation_files (conversation_id, created_at DESC)`,
      [],
    );
  } catch { }

  try {
    await sql.unsafe(`CREATE TABLE IF NOT EXISTS career_interest_options (
      id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
      slug VARCHAR(120) NOT NULL UNIQUE,
      label VARCHAR(200) NOT NULL,
      category VARCHAR(120),
      sort_order INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )`, []);
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS idx_career_interest_options_active_sort ON career_interest_options (is_active, sort_order)`, []);

    const countRows = (await sql.unsafe(`SELECT COUNT(*)::int as count FROM career_interest_options`, [])) as any[];
    const count = Number(countRows?.[0]?.count ?? 0);
    if (count === 0) {
      await sql.unsafe(
        `INSERT INTO career_interest_options (slug, label, category, sort_order)
         VALUES
           ('desarrollo-frontend', 'Desarrollo Frontend', 'tech', 10),
           ('analisis-de-datos', 'Análisis de Datos', 'tech', 20),
           ('ciberseguridad', 'Ciberseguridad', 'tech', 30),
           ('diseno-ux-ui', 'Diseño UX/UI', 'product', 40),
           ('gestion-de-producto', 'Gestión de Producto', 'product', 50),
           ('marketing-digital', 'Marketing Digital', 'growth', 60),
           ('machine-learning', 'Machine Learning', 'tech', 70),
           ('arquitectura-cloud', 'Arquitectura Cloud', 'tech', 80)
         ON CONFLICT (slug) DO NOTHING`,
        [],
      );
    }
  } catch { }

  async function execute<T = any>(sqlText: string, binds: Record<string, any> = {}) {
    const { text, values } = compileNamedBinds(sqlText, binds);
    const rows = (await sql.unsafe(text, values)) as T[];
    return { rows };
  }

  async function queryMany<T = any>(sqlText: string, binds: Record<string, any> = {}) {
    const res = await execute<T>(sqlText, binds);
    return res.rows;
  }

  async function queryOne<T = any>(sqlText: string, binds: Record<string, any> = {}) {
    const rows = await queryMany<T>(sqlText, binds);
    return rows[0] ?? null;
  }

  return { sql, execute, queryOne, queryMany };
}

/**
 * Cierra el cliente PostgreSQL.
 */
export async function closeDb(db: Db) {
  await db.sql.end({ timeout: 10 });
}
