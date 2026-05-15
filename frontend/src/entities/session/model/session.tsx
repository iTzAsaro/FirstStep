import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { SessionApi, SessionState } from "@/entities/session/model/types";
import { readJson, removeItem, writeJson } from "@/shared/lib/storage";

const STORAGE_KEY = "firststep.session.v1";

const defaultState: SessionState = {
  isAuthenticated: false,
  role: null,
  userName: null,
  companyName: null,
  onboardingCompleted: false,
};

function normalizeNameFromEmail(email: string) {
  const raw = email.split("@")[0] ?? "";
  const cleaned = raw.trim().replaceAll(".", " ").replaceAll("_", " ");
  const first = cleaned.split(" ").filter(Boolean)[0] ?? "Usuario";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

const SessionContext = createContext<SessionApi | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(() => {
    const persisted = readJson<SessionState>(STORAGE_KEY);
    if (!persisted) return defaultState;
    return {
      ...defaultState,
      ...persisted,
    };
  });

  useEffect(() => {
    writeJson(STORAGE_KEY, state);
  }, [state]);

  const api: SessionApi = useMemo(() => {
    return {
      ...state,
      loginTalent: ({ email }) => {
        setState({
          isAuthenticated: true,
          role: "talento",
          userName: normalizeNameFromEmail(email),
          companyName: null,
          onboardingCompleted: false,
        });
      },
      loginCompany: ({ companyName, email }) => {
        setState({
          isAuthenticated: true,
          role: "empresa",
          userName: normalizeNameFromEmail(email),
          companyName,
          onboardingCompleted: true,
        });
      },
      completeOnboarding: () => {
        setState((prev) => ({
          ...prev,
          onboardingCompleted: true,
        }));
      },
      logout: () => {
        removeItem(STORAGE_KEY);
        setState(defaultState);
      },
    };
  }, [state]);

  return <SessionContext.Provider value={api}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("SessionProvider no está montado");
  }
  return ctx;
}
