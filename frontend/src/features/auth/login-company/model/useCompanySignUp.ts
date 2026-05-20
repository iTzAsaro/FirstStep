// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useCompanySignUp.ts                                     ║
// ║ Módulo:      frontend/src/features/auth/login-company/model          ║
// ║ Descripción: Hook de registro para empresa (mock) + navegación.      ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función para registrar una empresa en modo mock.
 * En el estado actual, reutiliza el login de empresa y redirige al dashboard.
 */
export function useCompanySignUp() {
  const session = useSession();
  const navigate = useNavigate();

  return (payload: { companyName: string; email: string }) => {
    session.loginCompany(payload);
    navigate(routes.companyDashboard);
  };
}
