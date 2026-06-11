import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LandingPage } from "@/pages/landing/ui/LandingPage";
import { LoginPortalPage } from "@/pages/login-portal/ui/LoginPortalPage";
import { LoginCompanyPage } from "@/pages/login-company/ui/LoginCompanyPage";
import { LoginUserPage } from "@/pages/login-user/ui/LoginUserPage";
import { SignUpCompanyPage } from "@/pages/signup-company/ui/SignUpCompanyPage";
import { SignUpTalentPage } from "@/pages/signup-talent/ui/SignUpTalentPage";
import { CompanyOnboardingPage } from "@/pages/onboarding-company/ui/CompanyOnboardingPage";
import { OnboardingUserPage } from "@/pages/onboarding-user/ui/OnboardingUserPage";
import { DashboardUserPage } from "@/pages/dashboard-user/ui/DashboardUserPage";
import { DashboardCompanyPage } from "@/pages/dashboard-company/ui/DashboardCompanyPage";
import { OpportunitiesUserPage } from "@/pages/opportunities-user/ui/OpportunitiesUserPage";
import { CvBuilderPage } from "@/pages/cv-builder/ui/CvBuilderPage";
import { ChatPage } from "@/pages/chat/ui/ChatPage";
import { InterviewPage } from "@/pages/interview/ui/InterviewPage";
import { routes } from "@/shared/config/routes";
import { renderWithApp } from "@/test/testUtils";

function okJson(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

describe("pages smoke", () => {
  beforeEach(() => {
    vi.mocked(globalThis.fetch).mockReset();
    localStorage.clear();
  });

  it("renders LandingPage", () => {
    renderWithApp(<LandingPage />, { route: routes.home });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /unirme|quiero mi acceso/i }).length).toBeGreaterThan(0);
  });

  it("renders LoginPortalPage", () => {
    renderWithApp(<LoginPortalPage />, { route: routes.portal });
    expect(screen.getByText(/bienvenido/i)).toBeInTheDocument();
  });

  it("renders LoginUserPage", () => {
    renderWithApp(<LoginUserPage />, { route: routes.login });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders LoginCompanyPage", () => {
    renderWithApp(<LoginCompanyPage />, { route: routes.companyLogin });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders SignUpTalentPage", () => {
    renderWithApp(<SignUpTalentPage />, { route: routes.talentSignUp });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders SignUpCompanyPage", () => {
    renderWithApp(<SignUpCompanyPage />, { route: routes.companySignUp });
    expect(screen.getAllByRole("heading", { name: /crea tu cuenta/i }).length).toBeGreaterThan(0);
  });

  it("renders CompanyOnboardingPage", () => {
    renderWithApp(<CompanyOnboardingPage />, { route: routes.companyOnboarding });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders OnboardingUserPage", () => {
    renderWithApp(<OnboardingUserPage />, { route: routes.onboarding });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders DashboardUserPage with mocked API", async () => {
    localStorage.setItem("firststep.api.accessToken", "test-token");

    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/talent/dashboard")) {
        return okJson({
          user: { email: "test@example.com" },
          profile: { fullName: "Test User", careerInterests: ["A", "B", "C"] },
          recent: { cvs: [], sessions: [] },
          activity: [],
        });
      }
      if (url.includes("/api/talent/jobs")) {
        return okJson({
          jobs: [
            {
              id: 1,
              title: "Frontend Developer",
              description: "Desc",
              location: "Remoto",
              employmentType: "full_time",
              seniority: "junior",
              salaryMin: 1000,
              salaryMax: 2000,
              companyName: "Acme",
              createdAt: new Date().toISOString(),
              hasApplied: false,
            },
          ],
        });
      }
      return okJson({});
    });

    renderWithApp(<DashboardUserPage />, { route: routes.dashboard });
    expect(await screen.findByText(/test user/i)).toBeInTheDocument();
  });

  it("renders DashboardCompanyPage", () => {
    renderWithApp(<DashboardCompanyPage />, { route: routes.companyDashboard });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders OpportunitiesUserPage with mocked API", async () => {
    localStorage.setItem("firststep.api.accessToken", "test-token");

    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/talent/dashboard")) {
        return okJson({ profile: { careerInterests: ["A", "B", "C"] } });
      }
      if (url.includes("/api/talent/jobs")) {
        return okJson({
          jobs: [
            {
              id: 1,
              title: "Frontend Developer",
              description: "Desc",
              location: "Remoto",
              employmentType: "full_time",
              seniority: "junior",
              salaryMin: 1000,
              salaryMax: 2000,
              companyName: "Acme",
              createdAt: new Date().toISOString(),
              hasApplied: false,
            },
          ],
        });
      }
      return okJson({});
    });

    renderWithApp(<OpportunitiesUserPage />, { route: routes.opportunities });
    expect(await screen.findByRole("heading", { name: /oportunidades abiertas/i })).toBeInTheDocument();
  });

  it("renders CvBuilderPage", () => {
    renderWithApp(<CvBuilderPage />, { route: routes.cvBuilder });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders ChatPage", () => {
    renderWithApp(<ChatPage />, { route: routes.chat });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });

  it("renders InterviewPage", () => {
    renderWithApp(<InterviewPage />, { route: routes.interview });
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
  });
});
