import { Navigate, Route, Routes } from "react-router-dom"

import { LoginSelectionPage } from "@pages/login/ui/LoginSelectionPage"
import { CompanyLoginPage } from "@pages/company-login/ui/CompanyLoginPage"
import { CompanySignInPage } from "@pages/company-login/ui/CompanySignInPage"
import { CompanyForgotPasswordPage } from "@pages/company-forgot-password/ui/CompanyForgotPasswordPage"
import { CompanyDashboardPage } from "@pages/company-dashboard/ui/CompanyDashboardPage"
import { UserRegisterPage } from "@pages/user-login/ui/UserRegisterPage"
import { UserSignInPage } from "@pages/user-sign-in/ui/UserSignInPage"
import { UserForgotPasswordPage } from "@pages/user-forgot-password/ui/UserForgotPasswordPage"
import { UserDashboardPage } from "@pages/user-dashboard/ui/UserDashboardPage"
import { RequireCompanyAuth, RequireUserAuth } from "@processes/auth"

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login/company" replace />} />

      <Route path="/login" element={<LoginSelectionPage />} />
      <Route path="/login/company" element={<CompanyLoginPage />} />
      <Route path="/login/company/sign-in" element={<CompanySignInPage />} />
      <Route
        path="/login/company/forgot-password"
        element={<CompanyForgotPasswordPage />}
      />
      <Route path="/login/user" element={<UserRegisterPage />} />
      <Route path="/login/user/sign-in" element={<UserSignInPage />} />
      <Route path="/login/user/forgot-password" element={<UserForgotPasswordPage />} />

      <Route
        path="/dashboard/company"
        element={
          <RequireCompanyAuth>
            <CompanyDashboardPage />
          </RequireCompanyAuth>
        }
      />
      <Route
        path="/dashboard/user"
        element={
          <RequireUserAuth>
            <UserDashboardPage />
          </RequireUserAuth>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
