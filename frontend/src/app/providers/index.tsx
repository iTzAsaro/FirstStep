import type { ReactNode } from "react";

import { BrowserRouter } from "react-router-dom";

import { SessionProvider } from "@/entities/session";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <BrowserRouter>{children}</BrowserRouter>
    </SessionProvider>
  );
}
