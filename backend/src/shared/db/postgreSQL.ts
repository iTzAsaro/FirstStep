// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     postgreSQL.ts                                           ║
// ║ Módulo:      backend/src/shared/db                                   ║
// ║ Descripción: Adaptador de base de datos PostgreSQL/Supabase.         ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Env } from "../../config/env";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Falta DATABASE_URL.");
const sql = postgres(connectionString);

export type Db = {
  sql: any;
  execute<T = any>(sqlText: string, binds?: Record<string, any>): Promise<{ rows: T[] }>;
  queryOne<T = any>(sqlText: string, binds?: Record<string, any>): Promise<T | null>;
  queryMany<T = any>(sqlText: string, binds?: Record<string, any>): Promise<T[]>;
};

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
