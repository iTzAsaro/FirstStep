import type { ReactNode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppProviders } from "./index";

const listModelsMock = vi.fn();
const writeJsonMock = vi.fn();

vi.mock("@/shared/api/ollama/client", () => ({
  createOllamaClient: () => ({
    listModels: listModelsMock,
  }),
}));

vi.mock("@/shared/lib/storage", async () => {
  const actual = await vi.importActual<typeof import("@/shared/lib/storage")>("@/shared/lib/storage");
  return {
    ...actual,
    writeJson: (...args: unknown[]) => writeJsonMock(...args),
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: ReactNode }) => (
      <actual.MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {children}
      </actual.MemoryRouter>
    ),
  };
});

describe("AppProviders", () => {
  beforeEach(() => {
    listModelsMock.mockReset();
    writeJsonMock.mockReset();
    localStorage.clear();
  });

  it("renders children", () => {
    listModelsMock.mockResolvedValue([]);
    render(
      <AppProviders>
        <div>CHILD</div>
      </AppProviders>,
    );
    expect(screen.getByText("CHILD")).toBeInTheDocument();
  });

  it("writes successful startup check", async () => {
    listModelsMock.mockResolvedValue([{ name: "llama3.1:latest" }]);

    render(
      <AppProviders>
        <div>CHILD</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(writeJsonMock).toHaveBeenCalled();
    });
    const startupCall = writeJsonMock.mock.calls.find((call) => call[0] === "firststep.ollama.startup-check.v1");
    expect(startupCall?.[0]).toBe("firststep.ollama.startup-check.v1");
    expect(startupCall?.[1]).toMatchObject({ ok: true, modelAvailable: true });
  });

  it("writes failed startup check on non-abort errors", async () => {
    listModelsMock.mockRejectedValue(new Error("network down"));

    render(
      <AppProviders>
        <div>CHILD</div>
      </AppProviders>,
    );

    await waitFor(() => {
      expect(writeJsonMock).toHaveBeenCalled();
    });
    const startupCall = writeJsonMock.mock.calls.find((call) => call[0] === "firststep.ollama.startup-check.v1");
    expect(startupCall?.[1]).toMatchObject({ ok: false, message: "network down" });
  });

  it("ignores abort errors", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    listModelsMock.mockRejectedValue(abort);

    render(
      <AppProviders>
        <div>CHILD</div>
      </AppProviders>,
    );

    await Promise.resolve();
    await Promise.resolve();
    const startupCall = writeJsonMock.mock.calls.find((call) => call[0] === "firststep.ollama.startup-check.v1");
    expect(startupCall).toBeUndefined();
  });
});
