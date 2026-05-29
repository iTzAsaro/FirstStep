// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useCompanySignUp.ts                                     ║
// ║ Módulo:      frontend/src/features/auth/login-company/model          ║
// ║ Descripción: Hook de registro para empresa (mock) + navegación.      ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useCallback, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Registro de empresa (API real).
 *
 * - POST /api/auth/register/company
 * - Persiste accessToken para llamadas posteriores
 * - Crea sesión local (UI) y redirige al dashboard de empresa
 */
export function useCompanySignUp() {
  const session = useSession();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const signUp = useCallback(
    async (payload: {
      companyName: string;
      companySize: string;
      email: string;
      password: string;
      acceptedTerms: boolean;
      acceptedPrivacy: boolean;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/register/company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload.email,
            password: payload.password,
            companyName: payload.companyName,
            companySize: payload.companySize,
            acceptedTerms: payload.acceptedTerms,
            acceptedPrivacy: payload.acceptedPrivacy,
          }),
        });

        if (!res.ok) {
          let message = `Registro falló (${res.status}).`;
          try {
            const data = (await res.json()) as any;
            if (typeof data?.error?.message === "string" && data.error.message) {
              message = data.error.message;
            }
          } catch { }
          throw new Error(message);
        }

        const out = (await res.json()) as { accessToken?: string };
        if (out.accessToken) localStorage.setItem("firststep.api.accessToken", out.accessToken);

        session.loginCompany({ companyName: payload.companyName, email: payload.email });
        navigate(routes.companyDashboard);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [navigate, session],
  );

  return { signUp, isLoading, error, clearError };
}
