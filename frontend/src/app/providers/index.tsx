// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     index.tsx                                               ║
// ║ Módulo:      frontend/src/app/providers                              ║
// ║ Descripción: Providers globales (sesión, router y checks de arranque)║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useEffect, useMemo, type ReactNode } from "react";

import { BrowserRouter } from "react-router-dom";

import { SessionProvider } from "@/entities/session";
import { createOllamaClient } from "@/shared/api/ollama/client";
import { writeJson } from "@/shared/lib/storage";

const STARTUP_CHECK_KEY = "firststep.ollama.startup-check.v1";
const DEFAULT_MODEL = "llama3.1";

/**
 * Proveedores globales de la app.
 *
 * Incluye:
 * - SessionProvider (sesión mock + roles)
 * - BrowserRouter
 * - Chequeo al iniciar: disponibilidad de Ollama y del modelo por defecto
 */
export function AppProviders({ children }: { children: ReactNode }) {
  const client = useMemo(() => createOllamaClient(), []);

  useEffect(() => {
    client
      .listModels()
      .then((models) => {
        const names = models.map((m) => m.name).filter(Boolean);
        const modelAvailable = names.some((n) => n.toLowerCase().startsWith(DEFAULT_MODEL));
        writeJson(STARTUP_CHECK_KEY, { at: Date.now(), ok: true, model: DEFAULT_MODEL, modelAvailable });
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        if (e instanceof Error && e.name === "AbortError") return;
        const message = e instanceof Error ? e.message : String(e);
        writeJson(STARTUP_CHECK_KEY, { at: Date.now(), ok: false, model: DEFAULT_MODEL, message });
      });
  }, [client]);

  return (
    <SessionProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </SessionProvider>
  );
}
