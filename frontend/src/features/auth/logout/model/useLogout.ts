// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     useLogout.ts                                            ║
// ║ Módulo:      frontend/src/features/auth/logout/model                 ║
// ║ Descripción: Hook para cerrar sesión y redirigir al portal.          ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useNavigate } from "react-router-dom";

import { createClient } from "@supabase/supabase-js";
import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

/**
 * Devuelve una función para cerrar la sesión actual y navegar al portal.
 */
export function useLogout() {
  const session = useSession();
  const navigate = useNavigate();

  return async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        await supabase.auth.signOut();
      }
    } finally {
      localStorage.removeItem("firststep.api.accessToken");
    }

    session.logout();
    navigate(routes.portal);
  };
}
