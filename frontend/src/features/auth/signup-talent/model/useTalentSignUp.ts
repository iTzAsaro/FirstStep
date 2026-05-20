// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useTalentSignUp.ts                                      ║
// ║ Módulo:      frontend/src/features/auth/signup-talent/model          ║
// ║ Descripción: Hook de registro de talento (mock) + navegación.        ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función para registrar talento en modo mock.
 * En el estado actual, crea sesión local y redirige al onboarding.
 */
export function useTalentSignUp() {
  const session = useSession();
  const navigate = useNavigate();

  return (payload: { email: string }) => {
    session.loginTalent(payload);
    navigate(routes.onboarding);
  };
}
