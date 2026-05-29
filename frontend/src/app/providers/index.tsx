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
import { routes } from "@/shared/config/routes";
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
    const url = new URL(window.location.href);
    const hasOAuthSignal =
      url.searchParams.has("code") ||
      url.searchParams.has("error") ||
      url.searchParams.has("error_description") ||
      url.searchParams.has("error_code") ||
      (url.hash ? url.hash.includes("access_token=") || url.hash.includes("error=") || url.hash.includes("error_description=") : false);

    if (hasOAuthSignal) {
      const key = "firststep.oauth.returnTo";
      const stored = localStorage.getItem(key);
      const allowed = stored === routes.login || stored === routes.companySignUp ? stored : routes.login;
      if (stored) localStorage.removeItem(key);

      if (url.pathname !== allowed) {
        window.location.replace(`${allowed}${window.location.search}${window.location.hash}`);
      }
    }
  }, []);

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
