import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ChatPage } from "@/pages/chat";
import { InterviewPage } from "@/pages/interview";

function renderPage(ui: React.ReactNode) {
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

describe("ai pages (maintenance)", () => {
  it("renders ChatPage maintenance notice", () => {
    renderPage(<ChatPage />);
    expect(screen.getByText(/chat ia en mantenimiento/i)).toBeInTheDocument();
    expect(screen.getAllByText(/volver al dashboard/i).length).toBeGreaterThan(0);
  });

  it("renders InterviewPage maintenance notice", () => {
    renderPage(<InterviewPage />);
    expect(screen.getByText(/simulador de entrevistas en mantenimiento/i)).toBeInTheDocument();
    expect(screen.getAllByText(/volver al dashboard/i).length).toBeGreaterThan(0);
  });
});
