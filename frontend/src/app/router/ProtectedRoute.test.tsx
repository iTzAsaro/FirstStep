import { describe, expect, it } from "vitest";
import { Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/app/router/ProtectedRoute";
import { routes } from "@/shared/config/routes";
import { renderWithApp } from "@/test/testUtils";

describe("ProtectedRoute", () => {
  it("redirects to portal when not authenticated", () => {
    renderWithApp(
      <Routes>
        <Route path={routes.portal} element={<div>PORTAL</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute requiredRole="talento">
              <div>PRIVATE</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: "/private" },
    );

    expect(document.body.textContent).toContain("PORTAL");
  });

  it("renders children when role matches", () => {
    localStorage.setItem(
      "firststep.session.v1",
      JSON.stringify({
        isAuthenticated: true,
        role: "talento",
        userName: "Test",
        companyName: null,
        onboardingCompleted: true,
      }),
    );

    renderWithApp(
      <Routes>
        <Route path={routes.portal} element={<div>PORTAL</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute requiredRole="talento">
              <div>PRIVATE</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: "/private" },
    );

    expect(document.body.textContent).toContain("PRIVATE");
  });

  it("redirects talento to onboarding when onboarding is incomplete", () => {
    localStorage.setItem(
      "firststep.session.v1",
      JSON.stringify({
        isAuthenticated: true,
        role: "talento",
        userName: "Test",
        companyName: null,
        onboardingCompleted: false,
      }),
    );

    renderWithApp(
      <Routes>
        <Route path={routes.onboarding} element={<div>ONBOARDING</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute requiredRole="talento">
              <div>PRIVATE</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: "/private" },
    );

    expect(document.body.textContent).toContain("ONBOARDING");
  });

  it("redirects empresa to company onboarding when onboarding is incomplete", () => {
    localStorage.setItem(
      "firststep.session.v1",
      JSON.stringify({
        isAuthenticated: true,
        role: "empresa",
        userName: "Test",
        companyName: "Acme",
        onboardingCompleted: false,
      }),
    );

    renderWithApp(
      <Routes>
        <Route path={routes.companyOnboarding} element={<div>COMPANY_ONBOARDING</div>} />
        <Route
          path="/empresa/private"
          element={
            <ProtectedRoute requiredRole="empresa">
              <div>PRIVATE</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: "/empresa/private" },
    );

    expect(document.body.textContent).toContain("COMPANY_ONBOARDING");
  });

  it("redirects to portal when role does not match", () => {
    localStorage.setItem(
      "firststep.session.v1",
      JSON.stringify({
        isAuthenticated: true,
        role: "empresa",
        userName: "Test",
        companyName: "Acme",
        onboardingCompleted: true,
      }),
    );

    renderWithApp(
      <Routes>
        <Route path={routes.portal} element={<div>PORTAL</div>} />
        <Route
          path="/private"
          element={
            <ProtectedRoute requiredRole="talento">
              <div>PRIVATE</div>
            </ProtectedRoute>
          }
        />
      </Routes>,
      { route: "/private" },
    );

    expect(document.body.textContent).toContain("PORTAL");
  });
});
