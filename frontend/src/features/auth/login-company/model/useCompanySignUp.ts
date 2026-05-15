import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";

export function useCompanySignUp() {
  const session = useSession();
  const navigate = useNavigate();

  return (payload: { companyName: string; email: string }) => {
    session.loginCompany(payload);
    navigate(routes.companyDashboard);
  };
}
