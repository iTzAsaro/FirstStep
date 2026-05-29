// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useCompleteOnboarding.ts                                ║
// ║ Módulo:      frontend/src/features/onboarding/complete-profile/model ║
// ║ Descripción: Hook para finalizar onboarding y navegar al dashboard.  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useCallback, useState } from "react";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función que marca el onboarding como completado en la sesión.
 */
export function useCompleteOnboarding() {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        const token = localStorage.getItem("firststep.api.accessToken") ?? "";
        if (!token) {
          throw new Error("No hay sesión activa. Vuelve a iniciar sesión.");
        }

        const res = await fetch("/api/talent/onboarding", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

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
    [session],
  );

  const clearError = useCallback(() => setError(null), []);

  return { complete, isLoading, error, clearError };
}
