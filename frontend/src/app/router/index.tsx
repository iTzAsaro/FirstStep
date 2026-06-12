// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     index.tsx                                               ║
// ║ Módulo:      frontend/src/app/router                                 ║
// ║ Descripción: Definición de rutas de la SPA (React Router).           ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { ChatPage } from "@/pages/chat";
import { CompaniesUserPage } from "@/pages/companies-user";
import { CompanyPublicPage } from "@/pages/company-public";
import { DashboardCompanyPage } from "@/pages/dashboard-company";
import { DashboardUserPage } from "@/pages/dashboard-user";
import { CvBuilderPage } from "@/pages/cv-builder";
import { InterviewPage } from "@/pages/interview";
import { LandingPage } from "@/pages/landing";
import { LoginCompanyPage } from "@/pages/login-company";
import { LoginPortalPage } from "@/pages/login-portal";
import { LoginUserPage } from "@/pages/login-user";
import { TalentMessagesPage } from "@/pages/messages-talent/ui/TalentMessagesPage";
import { CompanyOnboardingPage } from "@/pages/onboarding-company/ui/CompanyOnboardingPage";
import { OnboardingUserPage } from "@/pages/onboarding-user";
import { OpportunitiesUserPage } from "@/pages/opportunities-user";
import { SignUpCompanyPage } from "@/pages/signup-company";
import { SignUpTalentPage } from "@/pages/signup-talent";
import { routes } from "@/shared/config/routes";

const FEATURE_CV_BUILDER = import.meta.env.VITE_FEATURE_CV_BUILDER !== "false";
const FEATURE_AI_CHAT = import.meta.env.VITE_FEATURE_AI_CHAT !== "false";

/**
 * Router principal de la aplicación.
 *
 * Define rutas públicas y rutas protegidas por rol (talento/empresa).
 */
export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.home} element={<LandingPage />} />
      <Route path={routes.portal} element={<LoginPortalPage />} />
      <Route path={routes.login} element={<LoginUserPage />} />
      <Route path={routes.talentSignUp} element={<SignUpTalentPage />} />
      <Route path={routes.companyLogin} element={<LoginCompanyPage />} />
      <Route path={routes.companySignUp} element={<SignUpCompanyPage />} />
      <Route
        path={routes.companyOnboarding}
        element={
          <ProtectedRoute requiredRole="empresa">
            <CompanyOnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.companyDashboard}
        element={
          <ProtectedRoute requiredRole="empresa">
            <DashboardCompanyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.onboarding}
        element={
          <ProtectedRoute requiredRole="talento">
            <OnboardingUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.dashboard}
        element={
          <ProtectedRoute requiredRole="talento">
            <DashboardUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.opportunities}
        element={
          <ProtectedRoute requiredRole="talento">
            <OpportunitiesUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.companies}
        element={
          <ProtectedRoute requiredRole="talento">
            <CompaniesUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/empresas/:id"
        element={
          <ProtectedRoute requiredRole="talento">
            <CompanyPublicPage />
          </ProtectedRoute>
        }
      />
      {FEATURE_CV_BUILDER && (
        <Route
          path={routes.cvBuilder}
          element={
            <ProtectedRoute requiredRole="talento">
              <CvBuilderPage />
            </ProtectedRoute>
          }
        />
      )}
      {FEATURE_AI_CHAT && (
        <Route
          path={routes.chat}
          element={
            <ProtectedRoute requiredRole="talento">
              <ChatPage />
            </ProtectedRoute>
          }
        />
      )}
      <Route
        path={routes.messages}
        element={
          <ProtectedRoute requiredRole="talento">
            <TalentMessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.interview}
        element={
          <ProtectedRoute requiredRole="talento">
            <InterviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={routes.home} replace />} />
    </Routes>
  );
}
