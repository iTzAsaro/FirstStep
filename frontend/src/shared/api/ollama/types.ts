// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      frontend/src/shared/api/ollama                          ║
// ║ Descripción: Tipos para requests/responses de la API local de Ollama. ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Roles soportados por el endpoint /api/chat de Ollama.
 */
export type OllamaRole = "system" | "user" | "assistant";

/**
 * Mensaje de chat para Ollama.
 */
export type OllamaMessage = {
  role: OllamaRole;
  content: string;
};

/**
 * Request de chat (streaming) para Ollama.
 */
export type OllamaChatRequest = {
  model: string;
  messages: OllamaMessage[];
  stream: true;
};

/**
 * Chunk NDJSON del streaming de /api/chat.
 */
export type OllamaChatChunk = {
  message?: {
    role: OllamaRole;
    content: string;
  };
  done?: boolean;
  error?: string;
};

/**
 * Respuesta del endpoint /api/tags (modelos disponibles).
 */
export type OllamaTagsResponse = {
  models: Array<{
    name: string;
    model?: string;
    modified_at?: string;
    size?: number;
    digest?: string;
    details?: unknown;
  }>;
};
