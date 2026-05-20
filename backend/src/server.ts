// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     server.ts                                               ║
// ║ Módulo:      backend/src                                             ║
// ║ Descripción: Punto de entrada del backend (env, DB, servidor HTTP).  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { closeDb, createDb } from "./shared/db/postgreSQL";

/**
 * Arranque del servidor:
 * - Carga variables de entorno
 * - Inicializa cliente Postgres (Supabase)
 * - Levanta Express
 * - Maneja SIGINT/SIGTERM para cierre ordenado
 */
async function main() {
  const env = loadEnv();
  const db = await createDb(env);
  const app = createApp({ env, db });

  const server = app.listen(env.port, () => {
    process.stdout.write(`Backend escuchando en http://localhost:${env.port}\n`);
  });

  const shutdown = async () => {
    server.close();
    await closeDb(db);
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  const msg = e instanceof Error ? e.message : String(e);
  process.stderr.write(`${msg}\n`);
  process.exit(1);
});
