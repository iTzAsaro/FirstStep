// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useCompleteOnboarding.ts                                ║
// ║ Módulo:      frontend/src/features/onboarding/complete-profile/model ║
// ║ Descripción: Hook para finalizar onboarding y navegar al dashboard.  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useCallback, useState } from "react";

import { createClient } from "@supabase/supabase-js";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función que marca el onboarding como completado en la sesión.
 */
export function useCompleteOnboarding() {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readSupabaseUrl = () => {
    const env = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const local = localStorage.getItem("firststep.supabase.url") ?? undefined;
    const raw = (env ?? local ?? "").trim();
    if (!raw) return "";
    return raw.replace("://xkhl", "://xhkl").replace(/\/+$/, "");
  };

  const readSupabaseAnonKey = () => {
    const env = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    const local = localStorage.getItem("firststep.supabase.anonKey") ?? undefined;
    return (env ?? local ?? "").trim();
  };

  const renewBackendTokenFromSupabase = useCallback(async () => {
    const supabaseUrl = readSupabaseUrl();
    const supabaseAnonKey = readSupabaseAnonKey();
    if (!supabaseUrl || !supabaseAnonKey) return null;

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) return null;
    const accessToken = data.session?.access_token ?? null;
    if (!accessToken) return null;

    const res = await fetch("/api/auth/login/oauth", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "talento" }),
    });
    if (!res.ok) return null;

    const out = (await res.json()) as { accessToken?: string };
    const nextToken = typeof out.accessToken === "string" ? out.accessToken.trim() : "";
    if (!nextToken) return null;
    localStorage.setItem("firststep.api.accessToken", nextToken);
    return nextToken;
  }, []);

  const submitOnboarding = useCallback(
    async (
      token: string,
      payload: {
        fullName: string;
        phone: string | null;
        city: string;
        university: string;
        degree: string;
        gradYear: string;
        gpa: string | null;
        careerInterests: string[];
      },
    ) => {
      return await fetch("/api/talent/onboarding", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },
    [],
  );

  const complete = useCallback(
    async (payload: {
      fullName: string;
      phone: string | null;
      city: string;
      university: string;
      degree: string;
      gradYear: string;
      gpa: string | null;
      careerInterests: string[];
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        let token = localStorage.getItem("firststep.api.accessToken") ?? "";
        if (!token) {
          throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");
        }

        let res = await submitOnboarding(token, payload);

        if (res.status === 401) {
          const renewedToken = await renewBackendTokenFromSupabase();
          if (renewedToken) {
            token = renewedToken;
            res = await submitOnboarding(token, payload);
          }
        }

        if (!res.ok) {
          let message = `Onboarding falló (${res.status}).`;
          try {
            const data = (await res.json()) as any;
            if (typeof data?.error?.message === "string" && data.error.message) {
              message = data.error.message;
            }
          } catch { }
          throw new Error(message);
        }

        session.completeOnboarding();
        window.location.assign(routes.dashboard);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [renewBackendTokenFromSupabase, session, submitOnboarding],
  );

  const clearError = useCallback(() => setError(null), []);

  return { complete, isLoading, error, clearError };
}
