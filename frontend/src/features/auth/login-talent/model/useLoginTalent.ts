import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

export function useLoginTalent() {
  const session = useSession();
  const navigate = useNavigate();

  return (payload: { email: string }) => {
    session.loginTalent(payload);
    navigate(routes.onboarding);
  };
}
