import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

export function useCompleteOnboarding() {
  const session = useSession();
  const navigate = useNavigate();

  return () => {
    session.completeOnboarding();
    navigate(routes.dashboard);
  };
}
