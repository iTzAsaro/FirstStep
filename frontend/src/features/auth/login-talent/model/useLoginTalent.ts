// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useLoginTalent.ts                                       ║
// ║ Módulo:      frontend/src/features/auth/login-talent/model           ║
// ║ Descripción: Hook de login para talento (sesión local + navegación). ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función para iniciar sesión como talento.
 * En el mock actual delega en el SessionProvider y redirige a onboarding.
 */
export function useLoginTalent() {
  const session = useSession();
  const navigate = useNavigate();

  return (payload: { email: string }) => {
    session.loginTalent(payload);
    navigate(routes.onboarding);
  };
}
