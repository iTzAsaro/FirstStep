export type OllamaRole = "system" | "user" | "assistant";

export type OllamaMessage = {
  role: OllamaRole;
  content: string;
};

export type OllamaChatRequest = {
  model: string;
  messages: OllamaMessage[];
  stream: true;
};

export type OllamaChatChunk = {
  message?: {
    role: OllamaRole;
    content: string;
  };
  done?: boolean;
  error?: string;
};

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
