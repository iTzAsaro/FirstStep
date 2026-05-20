// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      backend/src/modules/ai                                  ║
// ║ Descripción: Tipos de dominio para sesiones y mensajes de IA.        ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Tipos de sesión AI.
 */
export type AiSessionKind = "general" | "interview";

/**
 * Roles de mensaje para el chat.
 */
export type AiMessageRole = "system" | "user" | "assistant";

/**
 * Tipos de entrevista soportados.
 */
export type InterviewType = "técnica" | "rrhh" | "mixta";

/**
 * Nivel de dificultad soportado.
 */
export type InterviewDifficulty = "junior" | "mid" | "senior";

/**
 * Sesión persistida de IA.
 */
export type AiSession = {
  id: number;
  userId: number;
  kind: AiSessionKind;
  title: string;
  model: string;
  interviewRole: string | null;
  interviewType: InterviewType | null;
  interviewDifficulty: InterviewDifficulty | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Mensaje persistido dentro de una sesión.
 */
export type AiMessage = {
  id: number;
  sessionId: number;
  role: AiMessageRole;
  content: string;
  createdAt: string;
};
