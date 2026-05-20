// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      frontend/src/entities/ollama-session/model              ║
// ║ Descripción: Tipos base para sesiones locales de chat/entrevista IA. ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { OllamaMessage } from "@/shared/api/ollama/types";

/**
 * Categoriza el tipo de sesión que se guarda en el store local.
 */
export type SessionKind = "general" | "interview";

/**
 * Parámetros de configuración cuando la sesión corresponde a una entrevista.
 */
export type InterviewSettings = {
  role: string;
  interviewType: "técnica" | "rrhh" | "mixta";
  difficulty: "junior" | "mid" | "senior";
};

/**
 * Estructura persistida de una sesión de Ollama (mensajes + metadata).
 */
export type OllamaSession = {
  id: string;
  kind: SessionKind;
  title: string;
  model: string;
  createdAt: number;
  updatedAt: number;
  messages: OllamaMessage[];
  interviewSettings?: InterviewSettings;
};

/**
 * Estado completo del store local de sesiones y sesión activa por tipo.
 */
export type OllamaSessionsState = {
  sessions: OllamaSession[];
  activeSessionIdByKind: Partial<Record<SessionKind, string>>;
};
