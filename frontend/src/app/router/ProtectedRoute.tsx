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

  if (!session.isAuthenticated) {
    return <Navigate to={routes.portal} replace />;
  }

  if (role && session.role !== role) {
    return <Navigate to={routes.portal} replace />;
  }

  return children;
}
