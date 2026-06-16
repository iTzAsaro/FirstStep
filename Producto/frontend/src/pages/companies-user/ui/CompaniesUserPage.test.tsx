import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompaniesUserPage } from "./CompaniesUserPage";

const logoutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/features/auth/logout/model/useLogout", () => ({
  useLogout: () => logoutMock,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

function renderPage(ui: ReactNode) {
  return render(
    <MemoryRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {ui}
    </MemoryRouter>,
  );
}

function okJson(body: unknown, status = 200) {
  return {
    ok: true,
    status,
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

describe("CompaniesUserPage", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    navigateMock.mockReset();
    vi.mocked(globalThis.fetch).mockReset();
    localStorage.clear();
  });

  it("shows login error when there is no token", async () => {
    renderPage(<CompaniesUserPage />);
    expect(await screen.findByText(/no hay sesi[oó]n v[aá]lida/i)).toBeInTheDocument();
  });

  it("loads companies from the directory endpoint", async () => {
    localStorage.setItem("firststep.api.accessToken", "talent-token");
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/empresas/directory")) {
        return okJson({
          items: [
            {
              id: "10",
              companyName: "Acme",
              industry: "Tecnología",
              activitySector: null,
              location: "Santiago, CL",
              companySize: "11-50",
              website: "https://acme.com",
              contactEmail: "contacto@acme.com",
              description: "Empresa de tecnología",
              verificationStatus: "verified",
              updatedAt: "2026-06-11T00:00:00.000Z",
            },
          ],
          total: 1,
          page: 1,
          pageSize: 12,
        });
      }
      return errJson(404, "not mocked");
    });

    renderPage(<CompaniesUserPage />);
    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Verificada")).toBeInTheDocument();
  });

  it("updates filters and queries the endpoint with query param", async () => {
    const user = userEvent.setup();
    localStorage.setItem("firststep.api.accessToken", "talent-token");
    vi.mocked(globalThis.fetch).mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/empresas/directory")) return okJson({ items: [], total: 0, page: 1, pageSize: 12 });
      return errJson(404, "not mocked");
    });

    renderPage(<CompaniesUserPage />);

    await user.type(screen.getByPlaceholderText(/nombre de empresa/i), "Globant");

    await waitFor(() => {
      const calls = vi.mocked(globalThis.fetch).mock.calls.map((c) => String(c[0]));
      expect(calls.some((u) => u.includes("query=Globant"))).toBe(true);
    });
  });
});
