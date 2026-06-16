import { describe, expect, it } from "vitest";

import { ChatPage } from "@/pages/chat";
import { CompaniesUserPage } from "@/pages/companies-user";
import { CompanyPublicPage } from "@/pages/company-public";
import { CvBuilderPage } from "@/pages/cv-builder";
import { DashboardCompanyPage } from "@/pages/dashboard-company";
import { DashboardUserPage } from "@/pages/dashboard-user";
import { InterviewPage } from "@/pages/interview";
import { LandingPage } from "@/pages/landing";
import { LoginCompanyPage } from "@/pages/login-company";
import { LoginPortalPage } from "@/pages/login-portal";
import { LoginUserPage } from "@/pages/login-user";
import { TalentMessagesPage } from "@/pages/messages-talent";
import { CompanyOnboardingPage } from "@/pages/onboarding-company";
import { OnboardingUserPage } from "@/pages/onboarding-user";
import { OpportunitiesUserPage } from "@/pages/opportunities-user";
import { SignUpCompanyPage } from "@/pages/signup-company";
import { SignUpTalentPage } from "@/pages/signup-talent";

describe("page index exports", () => {
  it("re-exports every page component", () => {
    expect(ChatPage).toBeTypeOf("function");
    expect(CompaniesUserPage).toBeTypeOf("function");
    expect(CompanyPublicPage).toBeTypeOf("function");
    expect(CvBuilderPage).toBeTypeOf("function");
    expect(DashboardCompanyPage).toBeTypeOf("function");
    expect(DashboardUserPage).toBeTypeOf("function");
    expect(InterviewPage).toBeTypeOf("function");
    expect(LandingPage).toBeTypeOf("function");
    expect(LoginCompanyPage).toBeTypeOf("function");
    expect(LoginPortalPage).toBeTypeOf("function");
    expect(LoginUserPage).toBeTypeOf("function");
    expect(TalentMessagesPage).toBeTypeOf("function");
    expect(CompanyOnboardingPage).toBeTypeOf("function");
    expect(OnboardingUserPage).toBeTypeOf("function");
    expect(OpportunitiesUserPage).toBeTypeOf("function");
    expect(SignUpCompanyPage).toBeTypeOf("function");
    expect(SignUpTalentPage).toBeTypeOf("function");
  });
});
