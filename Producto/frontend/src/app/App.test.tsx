import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "./App";

vi.mock("@/app/providers", () => ({
  AppProviders: ({ children }: { children: React.ReactNode }) => <div data-testid="providers">{children}</div>,
}));

vi.mock("@/app/router", () => ({
  AppRouter: () => <div>ROUTER</div>,
}));

describe("App", () => {
  it("composes providers and router", () => {
    render(<App />);
    expect(screen.getByTestId("providers")).toBeInTheDocument();
    expect(screen.getByText("ROUTER")).toBeInTheDocument();
  });
});

