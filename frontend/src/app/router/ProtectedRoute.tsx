// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     ProtectedRoute.tsx                                      ║
// ║ Módulo:      frontend/src/app/router                                 ║
// ║ Descripción: Guard de rutas por autenticación y rol (talento/empresa)║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { ReactNode } from "react";

import { Navigate } from "react-router-dom";

import type { SessionRole } from "@/entities/session";
import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

export function ProtectedRoute({
  children,
  role,
}: {
  children: ReactNode;
  role?: SessionRole;
}) {
  const session = useSession();

  /**
   * Si no hay sesión, redirige al portal.
   */
  if (!session.isAuthenticated) {
    return <Navigate to={routes.portal} replace />;
  }

  /**
   * Si hay rol requerido y no coincide, redirige al portal.
   */
  if (role && session.role !== role) {
    return <Navigate to={routes.portal} replace />;
  }

  return children;
}
