// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useCompanyLogin.ts                                      ║
// ║ Módulo:      frontend/src/features/auth/login-company/model          ║
// ║ Descripción: Hook de login para empresa (sesión local + navegación). ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useCallback, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función para iniciar sesión como empresa.
 * En el mock actual delega en el SessionProvider y redirige al dashboard de empresa.
 */
export function useCompanyLogin() {
  const session = useSession();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const getCompanyNameFromProfile = useCallback(async (token: string, email: string) => {
    try {
      const res = await fetch("/api/company/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return email.split("@")[0] ?? "Empresa";
      const out = (await res.json()) as any;
      const name = typeof out?.profile?.companyName === "string" ? out.profile.companyName.trim() : "";
      return name || (email.split("@")[0] ?? "Empresa");
    } catch {
      return email.split("@")[0] ?? "Empresa";
    }
  }, []);

  const loginWithPassword = useCallback(
    async (payload: { email: string; password: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: payload.email, password: payload.password }),
        });

        if (!res.ok) {
          let message = `Login falló (${res.status}).`;
          try {
            const data = (await res.json()) as any;
            if (typeof data?.error?.message === "string" && data.error.message) {
              message = data.error.message;
            }
          } catch { }
          throw new Error(message);
        }

        const out = (await res.json()) as { accessToken?: string; user?: { role?: string } };
        if (out?.user?.role !== "empresa") {
          localStorage.removeItem("firststep.api.accessToken");
          throw new Error("Esta cuenta no es de empresa. Inicia sesión en /login o usa un correo distinto para empresa.");
        }
        if (out.accessToken) localStorage.setItem("firststep.api.accessToken", out.accessToken);
        const token = out.accessToken ?? "";
        if (!token) throw new Error("No hay sesión válida. Vuelve a iniciar sesión.");

        const companyName = await getCompanyNameFromProfile(token, payload.email);
        session.loginCompany({ companyName, email: payload.email });
        navigate(routes.companyDashboard);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [getCompanyNameFromProfile, navigate, session],
  );

  const loginWithEmail = useCallback(
    async (payload: { email: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("firststep.api.accessToken") ?? "";
        if (!token) throw new Error("No hay sesión válida. Vuelve a iniciar sesión.");
        const me = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!me.ok) throw new Error("No hay sesión válida. Vuelve a iniciar sesión.");
        const meOut = (await me.json()) as any;
        if (meOut?.user?.role !== "empresa") {
          localStorage.removeItem("firststep.api.accessToken");
          throw new Error("Esta cuenta no es de empresa. Inicia sesión en /login o usa un correo distinto para empresa.");
        }
        const companyName = await getCompanyNameFromProfile(token, payload.email);
        session.loginCompany({ companyName, email: payload.email });
        navigate(routes.companyDashboard);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [getCompanyNameFromProfile, navigate, session],
  );

  return { loginWithPassword, loginWithEmail, isLoading, error, clearError };
}
