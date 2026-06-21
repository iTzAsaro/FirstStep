// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     ChatPage.tsx                                            ║
// ║ Módulo:      frontend/src/pages/chat/ui                              ║
// ║ Descripción: Chat general con IA local (Ollama).                     ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui";
import { Input } from "@/shared/ui";
import { useOllamaSessions } from "@/entities/ollama-session";
import { createOllamaClient, OllamaError } from "@/shared/api/ollama/client";
import { UserLayout } from "@/shared/layout/UserLayout";

const DEFAULT_MODEL = "llama3:8b-instruct-q4_0";
const ollamaClient = createOllamaClient();

export function ChatPage() {
  const {
    sessionsByKind,
    getActiveSession,
    setActiveSession,
    createSession,
    upsertSession,
    deleteSession,
  } = useOllamaSessions();

  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeSession = getActiveSession("general");
  const sessions = sessionsByKind.general;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, scrollToBottom]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleNewSession = useCallback(() => {
    createSession({
      kind: "general",
      title: "Nuevo chat",
      model: DEFAULT_MODEL,
    });
    setError(null);
  }, [createSession]);

  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmedInput = userInput.trim();
      if (!trimmedInput || isStreaming) return;

      if (!activeSession) {
        handleNewSession();
        return;
      }

      setIsLoading(true);
      setIsStreaming(true);
      setError(null);

      const userMessage = { role: "user" as const, content: trimmedInput };
      const initialMessages = [...activeSession.messages, userMessage];
      const updatedSession = {
        ...activeSession,
        messages: initialMessages,
      };
      upsertSession(updatedSession);
      setUserInput("");

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let assistantContent = "";

      try {
        await ollamaClient.streamChat({
          model: activeSession.model,
          messages: initialMessages,
          options: { num_predict: 1024 },
          signal: abortController.signal,
          onToken: (token) => {
            assistantContent += token;
            upsertSession({
              ...updatedSession,
              messages: [...initialMessages, { role: "assistant", content: assistantContent }],
            });
          },
        });

        setIsStreaming(false);
        setIsLoading(false);
      } catch (err) {
        if (abortController.signal.aborted) {
          setIsStreaming(false);
          setIsLoading(false);
          return;
        }
        let errorMsg = "Ocurrió un error inesperado.";
        if (err instanceof OllamaError) {
          if (err.kind === "network") {
            errorMsg =
              "No se pudo conectar a Ollama. Asegúrate de que Ollama esté corriendo en http://127.0.0.1:11434";
          } else {
            errorMsg = err.message;
          }
        }
        setError(errorMsg);
        setIsStreaming(false);
        setIsLoading(false);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [activeSession, userInput, isStreaming, upsertSession, handleNewSession],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage],
  );

  const handleStartEditTitle = useCallback(() => {
    if (!activeSession) return;
    setEditedTitle(activeSession.title);
    setIsEditingTitle(true);
  }, [activeSession]);

  const handleSaveTitle = useCallback(() => {
    if (!activeSession || !editedTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }
    upsertSession({ ...activeSession, title: editedTitle.trim() });
    setIsEditingTitle(false);
  }, [activeSession, editedTitle, upsertSession]);

  const handleCancelEditTitle = useCallback(() => {
    setIsEditingTitle(false);
  }, []);

  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleSaveTitle();
      } else if (e.key === "Escape") {
        handleCancelEditTitle();
      }
    },
    [handleSaveTitle, handleCancelEditTitle],
  );

  if (!activeSession) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-center max-w-2xl">
            <div className="mb-6">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[linear-gradient(135deg,#1e3456,#5d85c4)] text-3xl shadow-lg shadow-[#294266]/20">
                💬
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-[#1e3456]">Chat con IA</h1>
            <p className="text-slate-600 mb-8 text-lg">
              Inicia una nueva conversación con nuestro asistente de IA local para resolver dudas,
              practicar o explorar ideas.
            </p>
            <Button
              onClick={handleNewSession}
              className="px-8 py-3 rounded-full bg-[#1e3456] hover:bg-[#15263d]"
            >
              Comenzar nuevo chat
            </Button>
          </div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="flex h-[calc(100vh-160px)] gap-6">
        {/* Sidebar */}
        <div className="w-72 bg-white border border-slate-200 rounded-3xl p-5 flex flex-col shadow-sm">
          <div className="mb-6">
            <Button onClick={handleNewSession} className="w-full rounded-full bg-[#1e3456] hover:bg-[#15263d]">
              + Nuevo chat
            </Button>
          </div>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Chats recientes
            </p>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSession("general", session.id)}
                className={`w-full text-left p-4 rounded-2xl text-sm transition-colors ${
                  session.id === activeSession.id
                    ? "bg-blue-50 text-[#1e3456] border border-blue-100"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="font-semibold truncate">{session.title}</div>
                <div className="text-xs text-slate-400 mt-1">
                  {session.messages.length} mensajes
                </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">
                No hay chats aún
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl flex flex-col shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b border-slate-100 p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    ref={titleInputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="text-xl font-bold border-0 p-0 focus:ring-0 w-80"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="text-emerald-600 hover:text-emerald-700"
                    aria-label="Guardar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelEditTitle}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Cancelar"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" x2="6" y1="6" y2="18" />
                      <line x1="6" x2="18" y1="6" y2="18" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#1e3456]">{activeSession.title}</h1>
                  <button
                    onClick={handleStartEditTitle}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label="Editar nombre"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                      <path d="m15 5 4 4" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                {activeSession.model}
              </span>
              <button
                onClick={() => deleteSession(activeSession.id)}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm px-3 py-2 rounded-full hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                Eliminar
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f8fafc]">
            {activeSession.messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#1e3456] text-white rounded-tr-sm"
                      : "bg-white text-slate-800 border border-slate-100 rounded-tl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 text-red-800 p-5 rounded-2xl max-w-lg border border-red-100">
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" x2="12" y1="8" y2="12" />
                      <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 p-5 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <Input
                type="text"
                placeholder="Escribe tu mensaje..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1 rounded-2xl border-slate-200 focus:ring-2 focus:ring-[#294266]/20"
              />
              <Button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="rounded-2xl bg-[#1e3456] hover:bg-[#15263d] px-6"
              >
                {isLoading ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
