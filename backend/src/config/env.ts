// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     env.ts                                                  ║
// ║ Módulo:      backend/src/config                                      ║
// ║ Descripción: Carga y validación de variables de entorno del backend. ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import fs from "node:fs";
import path from "node:path";

export type Env = {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  jwtExpiresIn: string | number;
  bcryptRounds: number;
  corsOrigin: string | null;
  databaseUrl: string;
  dbTestOnStartup: boolean;
  supabaseJwtSecret: string | null;
};

/**
 * Lee una variable de entorno requerida.
 * Lanza error si no existe.
 */
function readRequired(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Falta variable de entorno requerida: ${name}`);
  return value;
}

/**
 * Lee una variable de entorno opcional.
 * Devuelve null si no existe.
 */
function readOptional(name: string) {
  const value = process.env[name];
  if (!value) return null;
  return value;
}

/**
 * Interpreta valores booleanos desde variables de entorno.
 */
function readBool(name: string, fallback: boolean) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "off"].includes(normalized)) return false;
  return fallback;
}

/**
 * Lee una variable numérica con fallback.
 * Lanza error si existe pero no es un número válido.
 */
function readNumber(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Variable ${name} no es numérica: ${raw}`);
  return n;
}

function parseDotEnvValue(raw: string) {
  const trimmed = raw.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function applyDotEnvFile(filePath: string) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const l = line.trim();
    if (!l || l.startsWith("#")) continue;
    const idx = l.indexOf("=");
    if (idx <= 0) continue;
    const key = l.slice(0, idx).trim();
    const value = parseDotEnvValue(l.slice(idx + 1));
    if (!key) continue;
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/**
 * Carga el archivo .env (si existe) y aplica valores a process.env.
 *
 * No sobrescribe variables ya presentes en el entorno.
 */
function loadDotEnvOnce() {
  if (process.env.__FIRSTSTEP_DOTENV_LOADED === "1") return;
  process.env.__FIRSTSTEP_DOTENV_LOADED = "1";

  const cwd = process.cwd();
  const candidates = [path.join(cwd, ".env"), path.join(cwd, "..", ".env")];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) applyDotEnvFile(p);
    } catch {
      // Ignorar: si el .env no se puede leer, la validación posterior levantará errores.
    }
  }

}

/**
 * Carga la configuración del backend desde variables de entorno.
 *
 * Requeridas:
 * - DATABASE_URL (cadena oficial de Supabase)
 *
 * - JWT_SECRET (en producción)
 */
export function loadEnv(): Env {
  loadDotEnvOnce();

  const nodeEnv = process.env.NODE_ENV ?? "development";
  const port = readNumber("PORT", 3001);

  const jwtSecret = process.env.JWT_SECRET ?? (nodeEnv === "development" ? "dev-secret-change-me" : "");
  if (!jwtSecret) throw new Error("Falta JWT_SECRET.");

  const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "15m";
  const bcryptRounds = readNumber("BCRYPT_ROUNDS", 10);
  const corsOrigin = readOptional("CORS_ORIGIN");

  const databaseUrl = readRequired("DATABASE_URL");
  const dbTestOnStartup = readBool("DB_TEST_ON_STARTUP", nodeEnv === "development");
  const supabaseJwtSecret = readOptional("SUPABASE_JWT_SECRET");

  return {
    port,
    nodeEnv,
    jwtSecret,
    jwtExpiresIn,
    bcryptRounds,
    corsOrigin,
    databaseUrl,
    dbTestOnStartup,
    supabaseJwtSecret,
  };
}
