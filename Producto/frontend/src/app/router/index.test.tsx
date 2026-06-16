import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppRouter } from "./index";
import { routes } from "@/shared/config/routes";

vi.mock("@/app/router/ProtectedRoute", () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/chat", () => ({ ChatPage: () => <div>ChatPage</div> }));
vi.mock("@/pages/companies-user", () => ({ CompaniesUserPage: () => <div>CompaniesUserPage</div> }));
vi.mock("@/pages/company-public", () => ({ CompanyPublicPage: () => <div>CompanyPublicPage</div> }));
vi.mock("@/pages/dashboard-company", () => ({ DashboardCompanyPage: () => <div>DashboardCompanyPage</div> }));
vi.mock("@/pages/dashboard-user", () => ({ DashboardUserPage: () => <div>DashboardUserPage</div> }));
vi.mock("@/pages/cv-builder", () => ({ CvBuilderPage: () => <div>CvBuilderPage</div> }));
vi.mock("@/pages/interview", () => ({ InterviewPage: () => <div>InterviewPage</div> }));
vi.mock("@/pages/landing", () => ({ LandingPage: () => <div>LandingPage</div> }));
vi.mock("@/pages/login-company", () => ({ LoginCompanyPage: () => <div>LoginCompanyPage</div> }));
vi.mock("@/pages/login-portal", () => ({ LoginPortalPage: () => <div>LoginPortalPage</div> }));
vi.mock("@/pages/login-user", () => ({ LoginUserPage: () => <div>LoginUserPage</div> }));
vi.mock("@/pages/onboarding-company/ui/CompanyOnboardingPage", () => ({
  CompanyOnboardingPage: () => <div>CompanyOnboardingPage</div>,
}));
vi.mock("@/pages/messages-talent/ui/TalentMessagesPage", () => ({
  TalentMessagesPage: () => <div>TalentMessagesPage</div>,
}));
vi.mock("@/pages/onboarding-user", () => ({ OnboardingUserPage: () => <div>OnboardingUserPage</div> }));
vi.mock("@/pages/opportunities-user", () => ({ OpportunitiesUserPage: () => <div>OpportunitiesUserPage</div> }));
vi.mock("@/pages/signup-company", () => ({ SignUpCompanyPage: () => <div>SignUpCompanyPage</div> }));
vi.mock("@/pages/signup-talent", () => ({ SignUpTalentPage: () => <div>SignUpTalentPage</div> }));

describe("AppRouter", () => {
  const cases = [
    [routes.home, "LandingPage"],
    [routes.portal, "LoginPortalPage"],
    [routes.login, "LoginUserPage"],
    [routes.talentSignUp, "SignUpTalentPage"],
    [routes.companyLogin, "LoginCompanyPage"],
    [routes.companySignUp, "SignUpCompanyPage"],
    [routes.companyOnboarding, "CompanyOnboardingPage"],
    [routes.companyDashboard, "DashboardCompanyPage"],
    [routes.onboarding, "OnboardingUserPage"],
    [routes.dashboard, "DashboardUserPage"],
    [routes.opportunities, "OpportunitiesUserPage"],
    [routes.companies, "CompaniesUserPage"],
    ["/empresas/1", "CompanyPublicPage"],
    [routes.cvBuilder, "CvBuilderPage"],
    [routes.chat, "ChatPage"],
    [routes.messages, "TalentMessagesPage"],
    [routes.interview, "InterviewPage"],
  ] as const;

  it.each(cases)("renders route %s", (route, text) => {
    render(
      <MemoryRouter
        initialEntries={[route]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRouter />
      </MemoryRouter>,
    );
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it("redirects unknown routes to home", () => {
    render(
      <MemoryRouter
        initialEntries={["/unknown"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRouter />
      </MemoryRouter>,
    );
    expect(screen.getByText("LandingPage")).toBeInTheDocument();
  });
});
