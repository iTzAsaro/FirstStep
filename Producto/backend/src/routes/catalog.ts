// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     catalog.ts                                              ║
// ║ Módulo:      backend/src/routes                                      ║
// ║ Descripción: Catálogos (roles/industrias/intereses) para el frontend. ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Router } from "express";

import type { AppContext } from "../app";
import { authenticate } from "../shared/http/middleware/authenticate";
import { requireRole } from "../shared/http/middleware/requireRole";
import { Errors } from "../shared/http/middleware/errorHandler";
import { optionalString, requiredString } from "../shared/validation/validators";

function toSlug(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "item";
}

export function createCatalogRouter(ctx: AppContext) {
  const router = Router();

  router.get("/career-interests", async (_req, res, next) => {
    try {
      const rows = await ctx.db.queryMany<any>(
        `SELECT id::text as id,
                slug,
                label,
                category,
                sort_order as "sortOrder"
         FROM career_interest_options
         WHERE is_active = true
         ORDER BY sort_order ASC, label ASC`,
      );
      return res.json({ items: rows });
    } catch (e) {
      return next(e);
    }
  });

  router.post("/career-interests", authenticate(ctx.env), requireRole("empresa"), async (req, res, next) => {
    try {
      if (!req.auth) throw Errors.unauthorized();
      const body = req.body ?? {};
      const label = requiredString(body.label, "label");
      const category = optionalString(body.category, "category");
      const slug = optionalString(body.slug, "slug") || toSlug(label);
      const sortOrderRaw = body.sortOrder;
      const sortOrder = sortOrderRaw === undefined || sortOrderRaw === null ? 0 : Number(sortOrderRaw);
      if (!Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 100000) {
        throw Errors.badRequest("Campo 'sortOrder' es inválido.");
      }

      const rows = await ctx.db.queryMany<any>(
        `INSERT INTO career_interest_options (slug, label, category, sort_order, is_active, updated_at)
         VALUES (:slug, :label, :category, :sortOrder, true, NOW())
         ON CONFLICT (slug)
         DO UPDATE SET label = EXCLUDED.label,
                       category = EXCLUDED.category,
                       sort_order = EXCLUDED.sort_order,
                       is_active = true,
                       updated_at = NOW()
         RETURNING id::text as id, slug, label, category, sort_order as "sortOrder"`,
        { slug, label, category, sortOrder },
      );

      const item = rows?.[0];
      return res.status(201).json({ item });
    } catch (e) {
      return next(e);
    }
  });

  return router;
}

