// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     api.ts                                                  ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Router principal de /api y montaje de sub-rutas.        ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";

import { createAiRouter } from "./ai";
import { createAuthRouter } from "./auth";
import { createCompanyRouter } from "./company";
import { createCvRouter } from "./cv";
import { createTalentRouter } from "./talent";

/**
 * Crea el router de la API y monta módulos:
 * - /auth, /talent, /company, /cv, /ai
 */
export function createApiRouter(ctx: AppContext) {
  const router = Router();

  router.use("/auth", createAuthRouter(ctx));
  router.use("/talent", createTalentRouter(ctx));
  router.use("/company", createCompanyRouter(ctx));
  router.use("/cv", createCvRouter(ctx));
  router.use("/ai", createAiRouter(ctx));

  return router;
}
