import { Router } from "express";

import type { AppContext } from "../app";
import { JobRepository } from "../modules/jobs/jobRepository";
import { authenticate } from "../shared/http/middleware/authenticate";
import { Errors } from "../shared/http/middleware/errorHandler";
import { asNumberId, optionalString, requiredString } from "../shared/validation/validators";

function sanitizeFileName(name: string) {
  return name.replace(/[\r\n"]/g, "").trim() || "archivo";
}

function stripDataUrlPrefix(input: string) {
  const trimmed = input.trim();
  const comma = trimmed.indexOf(",");
  if (comma === -1) return trimmed;
  return trimmed.slice(comma + 1).trim();
}

export function createFilesRouter(ctx: AppContext) {
  const router = Router();
  const jobs = new JobRepository(ctx.db);

  router.post("/conversations/:id/files", authenticate(ctx.env), async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const conversationId = asNumberId(req.params.id, "id");
      const conversation = await jobs.getConversationForParticipant(req.auth.id, conversationId);
      if (!conversation) throw Errors.notFound("Conversación no encontrada.");

      const body = req.body ?? {};
      const fileName = requiredString(body.fileName, "fileName");
      const mimeType = optionalString(body.mimeType, "mimeType") || "application/octet-stream";
      const dataBase64Raw = requiredString(body.dataBase64, "dataBase64");
      const dataBase64 = stripDataUrlPrefix(dataBase64Raw);

      const buffer = Buffer.from(dataBase64, "base64");
      if (!buffer.length) throw Errors.badRequest("Archivo inválido.");
      const maxBytes = 1_200_000;
      if (buffer.length > maxBytes) throw Errors.badRequest("El archivo excede el tamaño permitido.");

      const stored = await jobs.createFileForConversation(conversationId, req.auth.id, {
        fileName,
        mimeType,
        data: buffer,
      });

      const url = `/api/files/${stored.id}`;
      return res.status(201).json({
        file: { id: stored.id, fileName: stored.fileName, mimeType: stored.mimeType, sizeBytes: stored.sizeBytes },
        url,
      });
    } catch (e) {
      return next(e);
    }
  });

  router.get("/files/:id", authenticate(ctx.env), async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const fileId = asNumberId(req.params.id, "id");
      const file = await jobs.getFileForParticipant(req.auth.id, fileId);
      if (!file) throw Errors.notFound("Archivo no encontrado.");

      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader("Cache-Control", "private, max-age=0, no-store");
      res.setHeader("Content-Disposition", `attachment; filename="${sanitizeFileName(String(file.fileName ?? "archivo"))}"`);
      res.status(200).send(file.data);
    } catch (e) {
      return next(e);
    }
  });

  return router;
}
