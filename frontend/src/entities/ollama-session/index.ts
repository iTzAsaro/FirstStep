// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     index.ts                                                ║
// ║ Módulo:      frontend/src/entities/ollama-session                    ║
// ║ Descripción: API pública (tipos + hook) para sesiones de Ollama.     ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

export type { InterviewSettings, OllamaSession, OllamaSessionsState, SessionKind } from "./model/types";
export { useOllamaSessions } from "./model/store";
