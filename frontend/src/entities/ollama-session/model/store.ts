// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     store.ts                                                ║
// ║ Módulo:      frontend/src/entities/ollama-session/model              ║
// ║ Descripción: Store de sesiones de chat/entrevista persistidas.       ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useCallback, useEffect, useMemo, useState } from "react";

import type { OllamaMessage } from "@/shared/api/ollama/types";
import { readJson, writeJson } from "@/shared/lib/storage";

import type { InterviewSettings, OllamaSession, OllamaSessionsState, SessionKind } from "./types";

const STORAGE_KEY = "firststep.ollama.sessions.v1";

/**
 * Timestamp actual en ms.
 */
function now() {
  return Date.now();
}

/**
 * Genera un id simple para sesiones en el cliente.
 */
function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Estado inicial vacío.
 */
function defaultState(): OllamaSessionsState {
  return { sessions: [], activeSessionIdByKind: {} };
}

/**
 * Carga el estado desde localStorage.
 */
function loadState(): OllamaSessionsState {
  return readJson<OllamaSessionsState>(STORAGE_KEY) ?? defaultState();
}

/**
 * Persiste el estado en localStorage.
 */
function saveState(state: OllamaSessionsState) {
  writeJson(STORAGE_KEY, state);
}

/**
 * Obtiene una sesión por id dentro del estado.
 */
function findSession(state: OllamaSessionsState, id: string) {
  return state.sessions.find((s) => s.id === id) ?? null;
}

/**
 * Inserta o actualiza una sesión dentro del estado (ordenando por updatedAt descendente).
 */
function updateSessionInState(state: OllamaSessionsState, session: OllamaSession) {
  const idx = state.sessions.findIndex((s) => s.id === session.id);
  if (idx === -1) return { ...state, sessions: [session, ...state.sessions] };
  const next = [...state.sessions];
  next[idx] = session;
  next.sort((a, b) => b.updatedAt - a.updatedAt);
  return { ...state, sessions: next };
}

/**
 * Hook de estado para gestionar sesiones de:
 * - Chat general
 * - Simulación de entrevistas
 *
 * Persistencia:
 * - localStorage (STORAGE_KEY)
 */
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

  /**
   * Inserta o actualiza una sesión existente.
   */
  const upsertSession = useCallback((session: OllamaSession) => {
    setState((prev) => updateSessionInState(prev, { ...session, updatedAt: now() }));
  }, []);

  /**
   * Reemplaza los mensajes de una sesión (útil para reiniciar conversación).
   */
  const resetSessionMessages = useCallback((id: string, nextMessages: OllamaMessage[] = []) => {
    setState((prev) => {
      const current = findSession(prev, id);
      if (!current) return prev;
      const updated: OllamaSession = { ...current, messages: nextMessages, updatedAt: now() };
      return updateSessionInState(prev, updated);
    });
  }, []);

  /**
   * Elimina una sesión y limpia selección activa si correspondía.
   */
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

