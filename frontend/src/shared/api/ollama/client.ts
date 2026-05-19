import type { OllamaChatChunk, OllamaChatRequest, OllamaMessage, OllamaTagsResponse } from "@/shared/api/ollama/types";

export type OllamaClientConfig = {
  baseUrl?: string;
};

export type StreamChatParams = {
  model: string;
  messages: OllamaMessage[];
  signal?: AbortSignal;
  onToken: (token: string) => void;
  onDone?: () => void;
};

export class OllamaError extends Error {
  readonly kind: "network" | "http" | "model" | "protocol";
  readonly status?: number;

  constructor(kind: OllamaError["kind"], message: string, status?: number) {
    super(message);
    this.kind = kind;
    this.status = status;
  }
}

function toText(err: unknown) {
  if (err instanceof Error) return err.message;
  return String(err);
}

function isAbortError(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

function normalizeBaseUrl(baseUrl?: string) {
  const fallback = import.meta.env.DEV ? "/ollama" : "http://localhost:11434";
  return baseUrl?.replace(/\/+$/, "") ?? fallback;
}

async function safeJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new OllamaError("protocol", "La respuesta de Ollama no es JSON válido.");
  }
}

export function createOllamaClient(config: OllamaClientConfig = {}) {
  const baseUrl = normalizeBaseUrl(config.baseUrl);

  async function listModels(signal?: AbortSignal) {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/tags`, { signal });
    } catch (e) {
      if (signal?.aborted || isAbortError(e)) throw e;
      throw new OllamaError("network", `No se pudo conectar con Ollama: ${toText(e)}`);
    }

    if (!res.ok) {
      throw new OllamaError("http", `Ollama respondió con error HTTP ${res.status}.`, res.status);
    }

    const data = await safeJson<OllamaTagsResponse>(res);
    return data.models ?? [];
  }

  async function hasModel(model: string, signal?: AbortSignal) {
    const models = await listModels(signal);
    const wanted = model.toLowerCase();
    return models.some((m) => (m.name ?? "").toLowerCase().startsWith(wanted));
  }

  async function streamChat(params: StreamChatParams) {
    const request: OllamaChatRequest = {
      model: params.model,
      messages: params.messages,
      stream: true,
    };

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: params.signal,
      });
    } catch (e) {
      if (params.signal?.aborted || isAbortError(e)) throw e;
      throw new OllamaError("network", `No se pudo conectar con Ollama: ${toText(e)}`);
    }

    if (!res.ok) {
      const hint =
        res.status === 403
          ? " (Si estás en desarrollo y ves la app en http://[::1]:5173, cambia a http://127.0.0.1:5173 y reinicia el dev server.)"
          : "";
      throw new OllamaError("http", `Ollama respondió con error HTTP ${res.status}.${hint}`, res.status);
    }

    if (!res.body) {
      throw new OllamaError("protocol", "Ollama no devolvió un cuerpo de respuesta (stream).");
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    function handleLine(line: string) {
      const trimmed = line.trim();
      if (!trimmed) return;

      let chunk: OllamaChatChunk;
      try {
        chunk = JSON.parse(trimmed) as OllamaChatChunk;
      } catch {
        throw new OllamaError("protocol", "Ollama devolvió un stream con formato inesperado.");
      }

      if (chunk.error) {
        throw new OllamaError("model", chunk.error);
      }

      const token = chunk.message?.content ?? "";
      if (token) params.onToken(token);
      if (chunk.done) {
        params.onDone?.();
      }
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      while (true) {
        const idx = buffer.indexOf("\n");
        if (idx === -1) break;
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        handleLine(line);
      }
    }

    buffer += decoder.decode();
    const rest = buffer.trim();
    if (rest) {
      for (const line of rest.split("\n")) {
        handleLine(line);
      }
    }
  }

  return {
    listModels,
    hasModel,
    streamChat,
  };
}
