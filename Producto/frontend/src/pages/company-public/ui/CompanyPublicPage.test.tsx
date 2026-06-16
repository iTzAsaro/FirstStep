import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CompanyPublicPage } from "./CompanyPublicPage";

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

function renderPage(ui: ReactNode, initialEntry = "/empresas/10") {
  return render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/empresas/:id" element={ui} />
      </Routes>
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

describe("CompanyPublicPage", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    navigateMock.mockReset();
    vi.mocked(globalThis.fetch).mockReset();
    localStorage.clear();
  });

  it("renders error when there is no token", async () => {
    renderPage(<CompanyPublicPage />);
    expect(await screen.findByText(/no hay sesi[oó]n v[aá]lida/i)).toBeInTheDocument();
  });

  it("loads and renders company detail", async () => {
    localStorage.setItem("firststep.api.accessToken", "talent-token");
    vi.mocked(globalThis.fetch).mockResolvedValue(
      okJson({
        company: {
          id: "10",
          companyName: "Acme",
          industry: "Tecnología",
          activitySector: null,
          location: "Santiago, CL",
          website: "https://acme.com",
          contactEmail: "contacto@acme.com",
          description: "Empresa de tecnología",
          verificationStatus: "verified",
          updatedAt: "2026-06-11T00:00:00.000Z",
        },
      }),
    );

    renderPage(<CompanyPublicPage />);
    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(screen.getByText(/verificada/i)).toBeInTheDocument();
  });
});
