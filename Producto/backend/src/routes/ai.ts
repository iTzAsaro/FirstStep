// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     ai.ts                                                   ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Persistencia de sesiones/mensajes AI (chat/entrevista). ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { AiRepository } from "../modules/ai/aiRepository";
import type { AiMessageRole, AiSessionKind, InterviewDifficulty, InterviewType } from "../modules/ai/types";
import { authenticate } from "../shared/http/middleware/authenticate";
import { Errors } from "../shared/http/middleware/errorHandler";
import { asNumberId, oneOf, optionalString, requiredString } from "../shared/validation/validators";

const SESSION_KINDS = ["general", "interview"] as const satisfies readonly AiSessionKind[];
const MESSAGE_ROLES = ["system", "user", "assistant"] as const satisfies readonly AiMessageRole[];
const INTERVIEW_TYPES = ["técnica", "rrhh", "mixta"] as const satisfies readonly InterviewType[];
const INTERVIEW_DIFFICULTIES = ["junior", "mid", "senior"] as const satisfies readonly InterviewDifficulty[];

/**
 * Rutas AI (requiere JWT):
 * - Sesiones: listar/crear/obtener/eliminar
 * - Mensajes: listar/agregar
 * - Reset: borrar mensajes (opcionalmente preservando system)
 * - Título: actualizar título de sesión
 */
export function createAiRouter(ctx: AppContext) {
  const router = Router();
  const repo = new AiRepository(ctx.db);

  router.use(authenticate(ctx.env));

  router.get("/sessions", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const kindRaw = req.query.kind;
      const kind = kindRaw ? oneOf(String(kindRaw), "kind", SESSION_KINDS) : undefined;
      const items = await repo.listSessions(req.auth.id, kind);
      return res.json({ items });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/sessions", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const kind = oneOf(body.kind, "kind", SESSION_KINDS);
      const title = requiredString(body.title, "title");
      const model = requiredString(body.model, "model");

      const interviewRole = kind === "interview" ? requiredString(body.interviewRole ?? body.role, "interviewRole") : null;
      const interviewType = kind === "interview" ? oneOf(body.interviewType, "interviewType", INTERVIEW_TYPES) : null;
      const interviewDifficulty =
        kind === "interview" ? oneOf(body.interviewDifficulty ?? body.difficulty, "interviewDifficulty", INTERVIEW_DIFFICULTIES) : null;

      const item = await repo.createSession({
        userId: req.auth.id,
        kind,
        title,
        model,
        interviewRole,
        interviewType,
        interviewDifficulty,
      });

      return res.status(201).json({ item });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/sessions/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const item = await repo.getSession(id);
      if (!item || item.userId !== req.auth.id) throw Errors.notFound();
      return res.json({ item });
    } catch (e) {
      return next(e);
    }
  });

  router.delete("/sessions/:id", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const item = await repo.getSession(id);
      if (!item || item.userId !== req.auth.id) throw Errors.notFound();
      await repo.deleteSession(id);
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  });

  router.get("/sessions/:id/messages", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const session = await repo.getSession(id);
      if (!session || session.userId !== req.auth.id) throw Errors.notFound();
      const items = await repo.listMessages(id);
      return res.json({ items });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/sessions/:id/messages", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const session = await repo.getSession(id);
      if (!session || session.userId !== req.auth.id) throw Errors.notFound();
      const body = req.body ?? {};
      const role = oneOf(body.role, "role", MESSAGE_ROLES);
      const content = requiredString(body.content, "content");
      const item = await repo.addMessage(id, role, content);
      return res.status(201).json({ item });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/sessions/:id/reset", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const session = await repo.getSession(id);
      if (!session || session.userId !== req.auth.id) throw Errors.notFound();

      const body = req.body ?? {};
      const keepSystem =
        body.keepSystem === undefined || body.keepSystem === null
          ? true
          : typeof body.keepSystem === "boolean"
            ? body.keepSystem
            : optionalString(body.keepSystem, "keepSystem") !== "false";

      await repo.resetMessages(id, keepSystem);
      return res.status(204).send();
    } catch (e) {
      return next(e);
    }
  });

  router.post("/sessions/:id/title", async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const id = asNumberId(req.params.id, "id");
      const session = await repo.getSession(id);
      if (!session || session.userId !== req.auth.id) throw Errors.notFound();
      const title = requiredString((req.body ?? {}).title, "title");
      await repo.touchSession(id, title);
      const item = await repo.getSession(id);
      return res.json({ item });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
