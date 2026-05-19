import type { OllamaMessage } from "@/shared/api/ollama/types";

export type SessionKind = "general" | "interview";

export type InterviewSettings = {
  role: string;
  interviewType: "técnica" | "rrhh" | "mixta";
  difficulty: "junior" | "mid" | "senior";
};

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

export type OllamaSessionsState = {
  sessions: OllamaSession[];
  activeSessionIdByKind: Partial<Record<SessionKind, string>>;
};
