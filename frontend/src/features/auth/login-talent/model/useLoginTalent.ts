// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useLoginTalent.ts                                       ║
// ║ Módulo:      frontend/src/features/auth/login-talent/model           ║
// ║ Descripción: Hook de login para talento (sesión local + navegación). ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useCallback, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Login de talento.
 *
 * Soporta:
 * - Email + password (API real)
 * - Login por OAuth (ya validado por backend) usando solo email para setear sesión UI
 */
export function useLoginTalent() {
  const session = useSession();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const isProfileComplete = useCallback((profile: any) => {
    if (!profile) return false;
    const fullName = typeof profile.fullName === "string" ? profile.fullName.trim() : "";
    const city = typeof profile.location === "string" ? profile.location.trim() : "";
    const university = typeof profile.university === "string" ? profile.university.trim() : "";
    const degree = typeof profile.degree === "string" ? profile.degree.trim() : "";
    const gradYear = typeof profile.gradYear === "number" ? profile.gradYear : null;
    const careers = Array.isArray(profile.careerInterests) ? profile.careerInterests : [];
    return Boolean(fullName && city && university && degree && gradYear && careers.length >= 3);
  }, []);

  const loadOnboardingState = useCallback(
    async (token: string) => {
      const res = await fetch("/api/talento/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { onboardingCompleted: false };
      const out = (await res.json()) as any;
      return { onboardingCompleted: isProfileComplete(out?.profile) };
    },
    [isProfileComplete],
  );

  const loginWithPassword = useCallback(
    async (payload: { email: string; password: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/talento/login", {
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

        const out = (await res.json()) as { accessToken?: string };
        if (out.accessToken) localStorage.setItem("firststep.api.accessToken", out.accessToken);
        const token = out.accessToken ?? "";
        const { onboardingCompleted } = token ? await loadOnboardingState(token) : { onboardingCompleted: false };
        session.loginTalent({ email: payload.email, onboardingCompleted });
        navigate(onboardingCompleted ? routes.dashboard : routes.onboarding);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadOnboardingState, navigate, session],
  );

  const loginWithEmail = useCallback(
    async (payload: { email: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("firststep.api.accessToken") ?? "";
        const { onboardingCompleted } = token ? await loadOnboardingState(token) : { onboardingCompleted: false };
        session.loginTalent({ email: payload.email, onboardingCompleted });
        navigate(onboardingCompleted ? routes.dashboard : routes.onboarding);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [loadOnboardingState, navigate, session],
  );

  return { loginWithPassword, loginWithEmail, isLoading, error, clearError };
}
