import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { SessionProvider } from "@/entities/session";

export function renderWithApp(ui: ReactElement, opts?: { route?: string }) {
  const route = opts?.route ?? "/";
  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <SessionProvider>{ui}</SessionProvider>
    </MemoryRouter>,
  );
}
