import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardCompanyPage } from "./DashboardCompanyPage";

const logoutMock = vi.fn();
const navigateMock = vi.fn();

vi.mock("@/entities/session", async () => {
  const actual = await vi.importActual<typeof import("@/entities/session")>("@/entities/session");
  return {
    ...actual,
    useSession: () => ({
      companyName: "Acme Corp",
    }),
  };
});

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

describe("DashboardCompanyPage", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    navigateMock.mockReset();
    vi.mocked(globalThis.fetch).mockReset();
    localStorage.clear();
  });

  it("shows login error when there is no token", async () => {
    const user = userEvent.setup();
    renderPage(<DashboardCompanyPage />);

    expect(await screen.findByText(/no hay sesion valida/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /iniciar sesion/i }));
    expect(navigateMock).toHaveBeenCalled();
  });

  it("loads dashboard data and shows company stats", async () => {
    const user = userEvent.setup();
    localStorage.setItem("firststep.api.accessToken", "company-token");
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/api/company/dashboard")) {
        return okJson({
          onboardingCompleted: true,
          profile: { companyName: "Acme Corp", verificationStatus: "verified" },
          stats: { jobsCount: 2, activeJobsCount: 1, applicationsCount: 4, conversationsCount: 1 },
          recentJobs: [],
          recentApplications: [],
        });
      }
      if (url.includes("/api/company/jobs") && (!init?.method || init.method === "GET")) {
        return okJson({
          jobs: [
            {
              id: 1,
              title: "Frontend Engineer",
              description: "Construye interfaces.",
              requirements: null,
              benefits: null,
              location: "Remoto",
              employmentType: "full_time",
              seniority: "mid",
              salaryMin: 2000,
              salaryMax: 3000,
              applicationDeadline: null,
              status: "active",
              createdAt: "2026-06-10T10:00:00.000Z",
              updatedAt: "2026-06-10T10:00:00.000Z",
              applicantsCount: 4,
            },
          ],
        });
      }
      if (url.includes("/api/company/applicants")) return okJson({ applicants: [] });
      if (url.includes("/api/company/conversations")) return okJson({ conversations: [] });
      return errJson(404, "not mocked");
    });

    renderPage(<DashboardCompanyPage />);

    expect(await screen.findByText(/acme corp/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(2);
    await user.click(screen.getByRole("button", { name: /oportunidades/i }));
    expect(await screen.findByText(/frontend engineer/i)).toBeInTheDocument();
  });

  it("creates a new job from the modal", async () => {
    const user = userEvent.setup();
    localStorage.setItem("firststep.api.accessToken", "company-token");
    vi.mocked(globalThis.fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.includes("/api/company/dashboard")) {
        return okJson({
          onboardingCompleted: true,
          profile: { companyName: "Acme Corp", verificationStatus: "verified" },
          stats: { jobsCount: 0, activeJobsCount: 0, applicationsCount: 0, conversationsCount: 0 },
          recentJobs: [],
          recentApplications: [],
        });
      }
      if (url.includes("/api/company/jobs") && (!init?.method || init.method === "GET")) {
        return okJson({ jobs: [] });
      }
      if (url.endsWith("/api/company/jobs") && init?.method === "POST") {
        return okJson({ job: { id: 1 } }, 201);
      }
      if (url.includes("/api/company/applicants")) return okJson({ applicants: [] });
      if (url.includes("/api/company/conversations")) return okJson({ conversations: [] });
      return errJson(404, "not mocked");
    });

    renderPage(<DashboardCompanyPage />);

    await user.click(screen.getByRole("button", { name: /publicar nuevo trabajo/i }));
    await user.type(screen.getByPlaceholderText(/disenador ux senior/i), "Backend Engineer");
    await user.type(
      screen.getByPlaceholderText(/describe responsabilidades, alcance y objetivos/i),
      "API ownership",
    );
    await user.click(screen.getByRole("button", { name: /^guardar$/i }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
  });
});
