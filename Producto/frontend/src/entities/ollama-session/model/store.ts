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
 * Carga el estado desde localStorage y corrige versiones de modelos antiguas.
 */
function loadState(): OllamaSessionsState {
  const state = readJson<OllamaSessionsState>(STORAGE_KEY);
  if (!state) return defaultState();
  
  // Corrige sesiones con modelos antiguos
  const updatedSessions = state.sessions.map(session => {
    // Cambia cualquier modelo anterior a llama3:8b-instruct-q4_0 (más rápido en CPU)
    if (session.model === "llama3.2:latest" || session.model === "llama3:latest") {
      return { ...session, model: "llama3:8b-instruct-q4_0" };
    }
    return session;
  });
  
  return { ...state, sessions: updatedSessions };
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
   * Si hay otras sesiones, selecciona la primera disponible.
   */
  const deleteSession = useCallback((id: string) => {
    setState((prev) => {
      const sessionToDelete = findSession(prev, id);
      const nextSessions = prev.sessions.filter((s) => s.id !== id);
      const nextActive = { ...prev.activeSessionIdByKind };

      if (sessionToDelete) {
        const kind = sessionToDelete.kind;
        if (nextActive[kind] === id) {
          const remainingSessionsOfKind = nextSessions.filter((s) => s.kind === kind);
          if (remainingSessionsOfKind.length > 0) {
            // Selecciona la primera sesión disponible
            nextActive[kind] = remainingSessionsOfKind[0].id;
          } else {
            delete nextActive[kind];
          }
        }
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

