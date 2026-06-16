// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     app.ts                                                  ║
// ║ Módulo:      backend/src                                             ║
// ║ Descripción: Configuración de Express (middlewares y rutas /api).    ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import express from "express";
import cors from "cors";

import type { Env } from "./config/env";
import type { Db } from "./shared/db/postgreSQL";
import { errorHandler } from "./shared/http/middleware/errorHandler";

import { createApiRouter } from "./routes/api";

export type AppContext = {
  env: Env;
  db: Db;
};

/**
 * Crea la aplicación Express con:
 * - JSON body parser
 * - CORS configurable
 * - Ruta /health
 * - Rutas /api
 * - Manejador de errores
 */
export function createApp(ctx: AppContext) {
  const app = express();

  app.use(express.json({ limit: "2mb" }));

  const corsOptions = ctx.env.corsOrigin
    ? { origin: ctx.env.corsOrigin.split(",").map((s) => s.trim()) }
    : { origin: true };
  app.use(cors(corsOptions));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", createApiRouter(ctx));
  app.use(errorHandler);

  return app;
}
