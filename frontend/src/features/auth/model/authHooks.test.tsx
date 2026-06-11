import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionProvider } from "@/entities/session";
import { useCompanyLogin } from "@/features/auth/login-company/model/useCompanyLogin";
import { useCompanySignUp } from "@/features/auth/login-company/model/useCompanySignUp";
import { useLoginTalent } from "@/features/auth/login-talent/model/useLoginTalent";
import { useLogout } from "@/features/auth/logout/model/useLogout";
import { useTalentSignUp } from "@/features/auth/signup-talent/model/useTalentSignUp";
import { routes } from "@/shared/config/routes";

const navigateMock = vi.fn();
const signOutMock = vi.fn(async () => ({ error: null }));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      signOut: signOutMock,
    },
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SessionProvider>{children}</SessionProvider>
    </MemoryRouter>
  );
}

function okJson(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

function errJson(status: number, message?: string) {
  return {
    ok: false,
    status,
    json: async () => ({ error: { message } }),
    text: async () => message ?? "",
  } as Response;
}

describe("auth hooks", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    signOutMock.mockClear();
    vi.mocked(globalThis.fetch).mockReset();
    localStorage.clear();
  });

  it("login talent with password stores token and navigates depending on onboarding", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(okJson({ accessToken: "t1" }))
      .mockResolvedValueOnce(
        okJson({
          profile: {
            fullName: "John",
            location: "CR",
            university: "U",
            degree: "CS",
            gradYear: 2026,
            careerInterests: ["A", "B", "C"],
          },
        }),
      );

    const { result } = renderHook(() => useLoginTalent(), { wrapper });
    await act(async () => {
      await result.current.loginWithPassword({ email: "john@example.com", password: "secret" });
    });

    expect(localStorage.getItem("firststep.api.accessToken")).toBe("t1");
    expect(navigateMock).toHaveBeenCalledWith(routes.dashboard);
  });

  it("login talent with password handles server errors", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(errJson(401, "Credenciales inválidas"));
    const { result } = renderHook(() => useLoginTalent(), { wrapper });

    await act(async () => {
      await result.current.loginWithPassword({ email: "john@example.com", password: "bad" });
    });

    expect(result.current.error).toMatch(/credenciales inválidas/i);
  });

  it("login talent with email goes to onboarding when profile is incomplete", async () => {
    localStorage.setItem("firststep.api.accessToken", "t2");
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(okJson({ profile: {} }));

    const { result } = renderHook(() => useLoginTalent(), { wrapper });
    await act(async () => {
      await result.current.loginWithEmail({ email: "john@example.com" });
    });

    expect(navigateMock).toHaveBeenCalledWith(routes.onboarding);
  });

  it("company login with password loads company name and navigates", async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(okJson({ accessToken: "corp-token", user: { role: "empresa" }, onboardingCompleted: false }))
      .mockResolvedValueOnce(okJson({ profile: { companyName: "Acme Corp" } }));

    const { result } = renderHook(() => useCompanyLogin(), { wrapper });
    await act(async () => {
      await result.current.loginWithPassword({ email: "corp@example.com", password: "secret" });
    });

    expect(localStorage.getItem("firststep.api.accessToken")).toBe("corp-token");
    expect(navigateMock).toHaveBeenCalledWith(routes.companyOnboarding);
  });

  it("company login rejects non-company users", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(okJson({ accessToken: "bad", user: { role: "talento" } }));

    const { result } = renderHook(() => useCompanyLogin(), { wrapper });
    await act(async () => {
      await result.current.loginWithPassword({ email: "corp@example.com", password: "secret" });
    });

    expect(result.current.error).toMatch(/no es de empresa/i);
    expect(localStorage.getItem("firststep.api.accessToken")).toBeNull();
  });

  it("company login with email validates current session", async () => {
    localStorage.setItem("firststep.api.accessToken", "corp-token");
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(okJson({ user: { role: "empresa" } }))
      .mockResolvedValueOnce(okJson({ profile: { companyName: "Stored Corp" }, onboardingCompleted: false }))
      .mockResolvedValueOnce(okJson({ profile: { companyName: "Stored Corp" }, onboardingCompleted: false }));

    const { result } = renderHook(() => useCompanyLogin(), { wrapper });
    await act(async () => {
      await result.current.loginWithEmail({ email: "corp@example.com" });
    });

    expect(navigateMock).toHaveBeenCalledWith(routes.companyOnboarding);
  });

  it("company sign up stores token and navigates", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(okJson({ accessToken: "new-corp-token", onboardingCompleted: false }));

    const { result } = renderHook(() => useCompanySignUp(), { wrapper });
    await act(async () => {
      await result.current.signUp({
        companyName: "Acme",
        companySize: "11-50",
        email: "corp@example.com",
        password: "Secret123",
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    });

    expect(localStorage.getItem("firststep.api.accessToken")).toBe("new-corp-token");
    expect(navigateMock).toHaveBeenCalledWith(routes.companyOnboarding);
  });

  it("talent sign up stores token and navigates to onboarding", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(okJson({ accessToken: "new-talent-token" }));

    const { result } = renderHook(() => useTalentSignUp(), { wrapper });
    await act(async () => {
      await result.current.signUp({
        email: "john@example.com",
        password: "Secret123",
        fullName: "John",
        acceptedTerms: true,
        acceptedPrivacy: true,
      });
    });

    expect(localStorage.getItem("firststep.api.accessToken")).toBe("new-talent-token");
    expect(navigateMock).toHaveBeenCalledWith(routes.onboarding);
  });

  it("logout clears session and navigates to portal", async () => {
    localStorage.setItem(
      "firststep.session.v1",
      JSON.stringify({
        isAuthenticated: true,
        role: "empresa",
        userName: "Corp",
        companyName: "Acme",
        onboardingCompleted: true,
      }),
    );
    localStorage.setItem("firststep.api.accessToken", "corp-token");

    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current();
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(routes.portal);
    });
    expect(localStorage.getItem("firststep.api.accessToken")).toBeNull();
  });
});
