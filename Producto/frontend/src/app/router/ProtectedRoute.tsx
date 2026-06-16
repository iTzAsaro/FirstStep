// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     ProtectedRoute.tsx                                      ║
// ║ Módulo:      frontend/src/app/router                                 ║
// ║ Descripción: Guard de rutas por autenticación y rol (talento/empresa)║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

import type { SessionRole } from "@/entities/session";
import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

export function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: SessionRole;
}) {
  const session = useSession();
  const location = useLocation();

  /**
   * Si no hay sesión, redirige al portal.
   */
  if (!session.isAuthenticated) {
    return <Navigate to={routes.portal} replace />;
  }

  /**
   * Si hay rol requerido y no coincide, redirige al portal.
   */
  if (requiredRole && session.role !== requiredRole) {
    return <Navigate to={routes.portal} replace />;
  }

  if (requiredRole === "talento" && session.role === "talento" && !session.onboardingCompleted) {
    if (location.pathname !== routes.onboarding) {
      return <Navigate to={routes.onboarding} replace />;
    }
  }

  if (requiredRole === "empresa" && session.role === "empresa" && !session.onboardingCompleted) {
    if (location.pathname !== routes.companyOnboarding) {
      return <Navigate to={routes.companyOnboarding} replace />;
    }
  }

  return children;
}
