import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionProvider } from "@/entities/session";
import { useCompleteOnboarding } from "./useCompleteOnboarding";

const getSessionMock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getSession: getSessionMock,
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

describe("useCompleteOnboarding", () => {
  beforeEach(() => {
    vi.mocked(globalThis.fetch).mockReset();
    getSessionMock.mockReset();
    localStorage.clear();
  });

  it("fails when there is no active backend token", async () => {
    const { result } = renderHook(() => useCompleteOnboarding(), { wrapper });

    await act(async () => {
      await result.current.complete({
        fullName: "John",
        phone: null,
        city: "CR",
        university: "U",
        degree: "CS",
        gradYear: "2026",
        gpa: null,
        careerInterests: ["A", "B", "C"],
      });
    });

    expect(result.current.error).toMatch(/no hay sesión activa/i);
  });

  it("submits onboarding successfully", async () => {
    localStorage.setItem("firststep.api.accessToken", "api-token");
    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignMock },
      writable: true,
    });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(okJson({ ok: true }));

    const { result } = renderHook(() => useCompleteOnboarding(), { wrapper });

    await act(async () => {
      await result.current.complete({
        fullName: "John",
        phone: null,
        city: "CR",
        university: "U",
        degree: "CS",
        gradYear: "2026",
        gpa: null,
        careerInterests: ["A", "B", "C"],
      });
    });

    expect(assignMock).toHaveBeenCalled();
  });

  it("renews token from supabase after 401 and retries", async () => {
    localStorage.setItem("firststep.api.accessToken", "expired");
    localStorage.setItem("firststep.supabase.url", "https://test.supabase.co");
    localStorage.setItem("firststep.supabase.anonKey", "anon");
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: "sb-token" } },
      error: null,
    });
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(errJson(401, "expired"))
      .mockResolvedValueOnce(okJson({ accessToken: "renewed-api-token" }))
      .mockResolvedValueOnce(okJson({ ok: true }));

    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { ...window.location, assign: assignMock },
      writable: true,
    });

    const { result } = renderHook(() => useCompleteOnboarding(), { wrapper });

    await act(async () => {
      await result.current.complete({
        fullName: "John",
        phone: null,
        city: "CR",
        university: "U",
        degree: "CS",
        gradYear: "2026",
        gpa: null,
        careerInterests: ["A", "B", "C"],
      });
    });

    expect(localStorage.getItem("firststep.api.accessToken")).toBe("renewed-api-token");
    expect(assignMock).toHaveBeenCalled();
  });

  it("captures server-side onboarding errors", async () => {
    localStorage.setItem("firststep.api.accessToken", "api-token");
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(errJson(400, "Datos inválidos"));

    const { result } = renderHook(() => useCompleteOnboarding(), { wrapper });

    await act(async () => {
      await result.current.complete({
        fullName: "John",
        phone: null,
        city: "CR",
        university: "U",
        degree: "CS",
        gradYear: "2026",
        gpa: null,
        careerInterests: ["A", "B", "C"],
      });
    });

    expect(result.current.error).toMatch(/datos inválidos/i);
  });
});
