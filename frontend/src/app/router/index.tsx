// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     index.tsx                                               ║
// ║ Módulo:      frontend/src/app/router                                 ║
// ║ Descripción: Definición de rutas de la SPA (React Router).           ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { ChatPage } from "@/pages/chat";
import { DashboardCompanyPage } from "@/pages/dashboard-company";
import { DashboardUserPage } from "@/pages/dashboard-user";
import { CvBuilderPage } from "@/pages/cv-builder";
import { InterviewPage } from "@/pages/interview";
import { LandingPage } from "@/pages/landing";
import { LoginCompanyPage } from "@/pages/login-company";
import { LoginPortalPage } from "@/pages/login-portal";
import { LoginUserPage } from "@/pages/login-user";
import { OnboardingUserPage } from "@/pages/onboarding-user";
import { OpportunitiesUserPage } from "@/pages/opportunities-user";
import { SignUpCompanyPage } from "@/pages/signup-company";
import { SignUpTalentPage } from "@/pages/signup-talent";
import { routes } from "@/shared/config/routes";

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
        path={routes.companyDashboard}
        element={
          <ProtectedRoute role="empresa">
            <DashboardCompanyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.onboarding}
        element={
          <ProtectedRoute role="talento">
            <OnboardingUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.dashboard}
        element={
          <ProtectedRoute role="talento">
            <DashboardUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.opportunities}
        element={
          <ProtectedRoute role="talento">
            <OpportunitiesUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.cvBuilder}
        element={
          <ProtectedRoute role="talento">
            <CvBuilderPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.chat}
        element={
          <ProtectedRoute role="talento">
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={routes.interview}
        element={
          <ProtectedRoute role="talento">
            <InterviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={routes.home} replace />} />
    </Routes>
  );
}
