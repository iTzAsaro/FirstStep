// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useCompanyLogin.ts                                      ║
// ║ Módulo:      frontend/src/features/auth/login-company/model          ║
// ║ Descripción: Hook de login para empresa (sesión local + navegación). ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

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

  return (payload: { companyName: string; email: string }) => {
    session.loginCompany(payload);
    navigate(routes.companyDashboard);
  };
}
