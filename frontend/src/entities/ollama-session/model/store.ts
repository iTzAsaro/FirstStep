import { useCallback, useEffect, useMemo, useState } from "react";

import type { OllamaMessage } from "@/shared/api/ollama/types";
import { readJson, writeJson } from "@/shared/lib/storage";

import type { InterviewSettings, OllamaSession, OllamaSessionsState, SessionKind } from "./types";

const STORAGE_KEY = "firststep.ollama.sessions.v1";

function now() {
  return Date.now();
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultState(): OllamaSessionsState {
  return { sessions: [], activeSessionIdByKind: {} };
}

function loadState(): OllamaSessionsState {
  return readJson<OllamaSessionsState>(STORAGE_KEY) ?? defaultState();
}

function saveState(state: OllamaSessionsState) {
  writeJson(STORAGE_KEY, state);
}

function findSession(state: OllamaSessionsState, id: string) {
  return state.sessions.find((s) => s.id === id) ?? null;
}

function updateSessionInState(state: OllamaSessionsState, session: OllamaSession) {
  const idx = state.sessions.findIndex((s) => s.id === session.id);
  if (idx === -1) return { ...state, sessions: [session, ...state.sessions] };
  const next = [...state.sessions];
  next[idx] = session;
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  return { ...state, sessions: next };
}

export function useOllamaSessions() {
  const [state, setState] = useState<OllamaSessionsState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const sessionsByKind = useMemo(() => {
    return {
      general: state.sessions.filter((s) => s.kind === "general"),
      interview: state.sessions.filter((s) => s.kind === "interview"),
    } satisfies Record<SessionKind, OllamaSession[]>;
  }, [state.sessions]);

  const getActiveSession = useCallback(
    (kind: SessionKind) => {
      const id = state.activeSessionIdByKind[kind];
      if (!id) return null;
      return findSession(state, id);
    },
    [state],
  );

  const setActiveSession = useCallback((kind: SessionKind, id: string) => {
    setState((prev) => ({
      ...prev,
      activeSessionIdByKind: { ...prev.activeSessionIdByKind, [kind]: id },
    }));
  }, []);

  const createSession = useCallback(
    (params: {
      kind: SessionKind;
      title: string;
      model: string;
      messages?: OllamaMessage[];
      interviewSettings?: InterviewSettings;
    }) => {
      const session: OllamaSession = {
        id: makeId(),
        kind: params.kind,
        title: params.title,
        model: params.model,
        createdAt: now(),
        updatedAt: now(),
        messages: params.messages ?? [],
        interviewSettings: params.interviewSettings,
      };

      setState((prev) => {
        const next = {
          ...prev,
          sessions: [session, ...prev.sessions],
          activeSessionIdByKind: { ...prev.activeSessionIdByKind, [params.kind]: session.id },
        };
        return next;
      });

      return session;
    },
    [],
  );

  const upsertSession = useCallback((session: OllamaSession) => {
    setState((prev) => updateSessionInState(prev, { ...session, updatedAt: now() }));
  }, []);

  const resetSessionMessages = useCallback((id: string, nextMessages: OllamaMessage[] = []) => {
    setState((prev) => {
      const current = findSession(prev, id);
      if (!current) return prev;
      const updated: OllamaSession = { ...current, messages: nextMessages, updatedAt: now() };
      return updateSessionInState(prev, updated);
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setState((prev) => {
      const nextSessions = prev.sessions.filter((s) => s.id !== id);
      const nextActive = { ...prev.activeSessionIdByKind };
      for (const kind of ["general", "interview"] as const) {
        if (nextActive[kind] === id) delete nextActive[kind];
      }
      return { ...prev, sessions: nextSessions, activeSessionIdByKind: nextActive };
    });
  }, []);

  return {
    state,
    sessionsByKind,
    getActiveSession,
    setActiveSession,
    createSession,
    upsertSession,
    resetSessionMessages,
    deleteSession,
  };
}

