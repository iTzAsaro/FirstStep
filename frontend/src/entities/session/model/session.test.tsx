import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionProvider, useSession } from "@/entities/session";

function wrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

describe("session", () => {
  it("starts with default state", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
  });

  it("loginTalent stores normalized user and onboarding flag", () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.loginTalent({ email: "john.doe_test@example.com", onboardingCompleted: true });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.role).toBe("talento");
    expect(result.current.userName).toBe("John");
    expect(result.current.onboardingCompleted).toBe(true);
  });

  it("loginCompany stores company session", () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.loginCompany({ companyName: "Acme", email: "corp@example.com", onboardingCompleted: true });
    });

    expect(result.current.role).toBe("empresa");
    expect(result.current.companyName).toBe("Acme");
    expect(result.current.onboardingCompleted).toBe(true);
  });

  it("completeOnboarding updates the flag", () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.loginTalent({ email: "test@example.com", onboardingCompleted: false });
    });
    act(() => {
      result.current.completeOnboarding();
    });

    expect(result.current.onboardingCompleted).toBe(true);
  });

  it("logout resets state and clears persistence", () => {
    const { result } = renderHook(() => useSession(), { wrapper });

    act(() => {
      result.current.loginCompany({ companyName: "Acme", email: "corp@example.com" });
    });
    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.role).toBeNull();
    expect(localStorage.getItem("firststep.session.v1")).toContain("\"isAuthenticated\":false");
  });

  it("throws when useSession is used without provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useSession())).toThrow(/SessionProvider no está montado/i);
    spy.mockRestore();
  });
});
