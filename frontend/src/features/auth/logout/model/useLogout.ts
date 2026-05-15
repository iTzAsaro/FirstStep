import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

export function useLogout() {
  const session = useSession();
  const navigate = useNavigate();

  return () => {
    session.logout();
    navigate(routes.portal);
  };
}
