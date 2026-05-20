// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useCompleteOnboarding.ts                                ║
// ║ Módulo:      frontend/src/features/onboarding/complete-profile/model ║
// ║ Descripción: Hook para finalizar onboarding y navegar al dashboard.  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función que marca el onboarding como completado en la sesión.
 */
export function useCompleteOnboarding() {
  const session = useSession();
  const navigate = useNavigate();

  return () => {
    session.completeOnboarding();
    navigate(routes.dashboard);
  };
}
