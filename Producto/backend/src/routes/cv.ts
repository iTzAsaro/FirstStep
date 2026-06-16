// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     cv.ts                                                   ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: CRUD de CVs (Currículum) para talento.                  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { CvRepository } from "../modules/cv/cvRepository";
import { authenticate } from "../shared/http/middleware/authenticate";
import { Errors } from "../shared/http/middleware/errorHandler";
import { requireRole } from "../shared/http/middleware/requireRole";
import { asNumberId, requiredString } from "../shared/validation/validators";

/**
 * Rutas de CV (solo rol talento):
 * - GET /           Lista CVs del usuario
 * - POST /          Crea CV
 * - GET /:id        Obtiene CV por id
 * - PUT /:id        Actualiza CV
 * - DELETE /:id     Elimina CV
 */
export function createCvRouter(ctx: AppContext) {
  const router = Router();
  const repo = new CvRepository(ctx.db);

  router.use(authenticate(ctx.env), requireRole("talento"));

  router.get("/", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const items = await repo.listByUser(req.auth.id);
      return res.json({ items });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const title = requiredString(body.title, "title");
      const content = requiredString(body.content, "content");
      const item = await repo.create(req.auth.id, { title, content });
      return res.status(201).json({ item });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const item = await repo.getById(id);
      if (!item || item.userId !== req.auth.id) throw Errors.notFound();
      return res.json({ item });
    } catch (e) {
      return next(e);
    }
  });

  router.put("/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const existing = await repo.getById(id);
      if (!existing || existing.userId !== req.auth.id) throw Errors.notFound();

      const body = req.body ?? {};
      const title = requiredString(body.title, "title");
      const content = requiredString(body.content, "content");
      const item = await repo.update(id, { title, content });
      return res.json({ item });
    } catch (e) {
      return next(e);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const existing = await repo.getById(id);
      if (!existing || existing.userId !== req.auth.id) throw Errors.notFound();
      await repo.delete(id);
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
