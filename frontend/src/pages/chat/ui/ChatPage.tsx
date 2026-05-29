// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     ChatPage.tsx                                            ║
// ║ Módulo:      frontend/src/pages/chat/ui                              ║
// ║ Descripción: Chat general con Ollama (streaming + sesiones locales). ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";

import { useOllamaSessions } from "@/entities/ollama-session";
import type { OllamaSession } from "@/entities/ollama-session";
import { routes } from "@/shared/config/routes";
import { createOllamaClient, OllamaError } from "@/shared/api/ollama/client";
import type { OllamaMessage } from "@/shared/api/ollama/types";
import { Button } from "@/shared/ui";

const DEFAULT_MODEL = "llama3.1";

/**
 * Timestamp actual en ms.
 */
function now() {
  return Date.now();
}

/**
 * Detecta abortos del streaming (AbortController).
 */
function isAbortError(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof Error && err.name === "AbortError") return true;
  return false;
}

/**
 * Formatea timestamps para la UI.
 */
function formatTime(ts: number) {
  return new Date(ts).toLocaleString();
}

/**
 * Recorta un texto para título de sesión.
 */
function trimTitle(text: string) {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (cleaned.length <= 42) return cleaned;
  return `${cleaned.slice(0, 42)}…`;
}

/**
 * Construye un título a partir del primer mensaje del usuario.
 */
function buildTitleFromMessages(messages: OllamaMessage[]) {
  const firstUser = messages.find((m) => m.role === "user")?.content ?? "Nueva conversación";
  return trimTitle(firstUser);
}

/**
 * Página de chat general.
 *
 * Funcionalidades:
 * - Sesiones persistidas en localStorage
 * - Streaming NDJSON token a token
 * - Detener (AbortController)
 * - Reiniciar conversación
 * - Manejo de errores y verificación de modelos
 */
export function ChatPage() {
  const client = useMemo(() => createOllamaClient(), []);
  const { sessionsByKind, getActiveSession, setActiveSession, createSession, upsertSession, resetSessionMessages, deleteSession } =
    useOllamaSessions();

  const [status, setStatus] = useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "ok"; modelAvailable: boolean }
    | { state: "error"; message: string }
  >({ state: "checking" });

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const active = getActiveSession("general");
  const model = DEFAULT_MODEL;

  useEffect(() => {
    let cancelled = false;
    setStatus({ state: "checking" });
    setErrorMsg(null);

    client
      .hasModel(DEFAULT_MODEL)
      .then((available) => {
        if (cancelled) return;
        setStatus({ state: "ok", modelAvailable: available });
      })
      .catch((e) => {
        if (cancelled || isAbortError(e)) return;
        setStatus({ state: "error", message: e instanceof Error ? e.message : String(e) });
      });

    return () => {
      cancelled = true;
    };
  }, [client]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, isStreaming]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${Math.max(next, 44)}px`;
  }, [input]);

  const messages = active?.messages ?? [];
  const canUseModel = status.state === "ok" && status.modelAvailable;

  const botStatus = useMemo(() => {
    if (status.state === "checking") {
      return { label: "Conectando", detail: "Verificando servicio local…", tone: "info" as const };
    }
    if (status.state === "error") {
      return { label: "Sin conexión", detail: status.message, tone: "danger" as const };
    }
    if (status.state === "ok" && !status.modelAvailable) {
      return { label: "Modelo no disponible", detail: `Ejecuta: ollama pull ${DEFAULT_MODEL}`, tone: "warning" as const };
    }
    if (isStreaming) {
      return { label: "Respondiendo", detail: "Generando respuesta…", tone: "active" as const };
    }
    return { label: "Listo", detail: "Puedes escribir un mensaje para comenzar.", tone: "ok" as const };
  }, [isStreaming, status]);

  function ensureSession() {
    if (active) return active;
    const session = createSession({ kind: "general", title: "Nueva conversación", model });
    return session;
  }

  async function send() {
    const text = input.trim();
    if (!text || isStreaming) return;
    if (!canUseModel) {
      setErrorMsg(
        status.state !== "ok"
          ? "No se pudo conectar con Ollama. Inicia el servicio e inténtalo de nuevo."
          : `El modelo seleccionado no está disponible. Ejecuta: ollama pull ${model}`,
      );
      return;
    }
    setInput("");
    setErrorMsg(null);

    const session = ensureSession();
    const nextMessages: OllamaMessage[] = [...session.messages, { role: "user", content: text }, { role: "assistant", content: "" }];
    const assistantIndex = nextMessages.length - 1;

    const title = session.title === "Nueva conversación" ? buildTitleFromMessages(nextMessages) : session.title;

    const updated: OllamaSession = {
      ...session,
      title,
      model,
      updatedAt: now(),
      messages: nextMessages,
    };
    upsertSession(updated);

    const abort = new AbortController();
    abortRef.current = abort;
    setIsStreaming(true);
    let assistantText = "";

    try {
      await client.streamChat({
        model,
        messages: nextMessages.slice(0, assistantIndex),
        signal: abort.signal,
        onToken: (token) => {
          assistantText += token;
          upsertSession({
            ...updated,
            messages: nextMessages.map((m, idx) => (idx === assistantIndex ? { ...m, content: assistantText } : m)),
            updatedAt: now(),
          });
        },
      });
    } catch (e) {
      if (abort.signal.aborted || isAbortError(e)) return;
      if (assistantText.trim().length === 0) {
        upsertSession({
          ...updated,
          messages: nextMessages.filter((_, idx) => idx !== assistantIndex),
          updatedAt: now(),
        });
      }
      const message =
        e instanceof OllamaError
          ? e.kind === "model"
            ? `Modelo no disponible o error del modelo: ${e.message}`
            : e.message
          : e instanceof Error
            ? e.message
            : String(e);
      setErrorMsg(message);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    const session = createSession({ kind: "general", title: "Nueva conversación", model, messages: [] });
    setActiveSession("general", session.id);
    setErrorMsg(null);
  }

  function resetCurrent() {
    if (!active) return;
    resetSessionMessages(active.id, []);
    setErrorMsg(null);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
      <style>{`
@media (prefers-reduced-motion: reduce) {
  .chat-enter { animation: none !important; }
}
@keyframes chatEnterUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes chatEnterSideL {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes chatEnterSideR {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}
.chat-enter-up { animation: chatEnterUp 420ms cubic-bezier(.2,.9,.2,1) both; }
.chat-enter-left { animation: chatEnterSideL 360ms cubic-bezier(.2,.9,.2,1) both; }
.chat-enter-right { animation: chatEnterSideR 360ms cubic-bezier(.2,.9,.2,1) both; }
`}</style>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={routes.dashboard} className="font-bold text-[#1e3456] text-lg tracking-tight">
              FirsTep
            </Link>
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Chat</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to={routes.interview}>
              <Button variant="secondary" size="sm">
                Simulador de entrevistas
              </Button>
            </Link>
            <Link to={routes.dashboard}>
              <Button variant="outline" size="sm">
                Volver
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto w-full flex-1 px-4 md:px-6 py-6">
        <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[70vh]">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Conversación</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{active ? active.title : "Selecciona o crea una sesión"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsSessionsOpen((v) => !v)} title="Sesiones">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
              <Button variant="outline" size="sm" onClick={resetCurrent} disabled={!active || isStreaming}>
                Reiniciar
              </Button>
              <Button variant="secondary" size="sm" onClick={stop} disabled={!isStreaming}>
                Detener
              </Button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {isSessionsOpen ? (
              <button
                type="button"
                className="lg:hidden absolute inset-0 bg-slate-950/20"
                onClick={() => setIsSessionsOpen(false)}
              />
            ) : null}

            <div
              className={[
                "w-full h-full grid grid-cols-1",
                isSessionsOpen ? "lg:grid-cols-[340px,1fr]" : "lg:grid-cols-[0px,1fr]",
              ].join(" ")}
            >
              <aside
                className={[
                  "hidden lg:flex bg-white border-r border-slate-200 overflow-hidden flex-col",
                  isSessionsOpen ? "w-[340px]" : "w-0",
                ].join(" ")}
              >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Sesiones</p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">Chat general</p>
                  </div>
                  <Button size="sm" onClick={newChat}>
                    Nuevo
                  </Button>
                </div>

                <div className="p-4 border-b border-slate-100 bg-slate-50/40">
                  <div className="text-[12px] text-slate-600 leading-snug">
                    <span className="font-semibold text-slate-800">Estado:</span>{" "}
                    <span className={botStatus.tone === "danger" ? "text-red-700" : botStatus.tone === "warning" ? "text-amber-700" : botStatus.tone === "ok" ? "text-emerald-700" : "text-slate-700"}>
                      {botStatus.label}
                    </span>
                    <span className="text-slate-500"> · {botStatus.detail}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {sessionsByKind.general.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No hay sesiones aún.</div>
                  ) : (
                    sessionsByKind.general.map((s) => {
                      const isActive = active?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setActiveSession("general", s.id)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            setActiveSession("general", s.id);
                          }}
                          className={[
                            "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors",
                            isActive ? "bg-blue-50" : "bg-white",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{formatTime(s.updatedAt)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(s.id);
                              }}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>

              <aside
                className={[
                  "lg:hidden fixed inset-y-0 left-0 w-[340px] max-w-[88vw] bg-white border-r border-slate-200 z-50 overflow-hidden flex flex-col",
                  "transition-transform duration-300 ease-out",
                  isSessionsOpen ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
              >
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Sesiones</p>
                    <p className="text-sm font-semibold text-slate-700 mt-1">Chat general</p>
                  </div>
                  <Button size="sm" onClick={newChat}>
                    Nuevo
                  </Button>
                </div>

                <div className="p-4 border-b border-slate-100 bg-slate-50/40">
                  <div className="text-[12px] text-slate-600 leading-snug">
                    <span className="font-semibold text-slate-800">Estado:</span>{" "}
                    <span className={botStatus.tone === "danger" ? "text-red-700" : botStatus.tone === "warning" ? "text-amber-700" : botStatus.tone === "ok" ? "text-emerald-700" : "text-slate-700"}>
                      {botStatus.label}
                    </span>
                    <span className="text-slate-500"> · {botStatus.detail}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {sessionsByKind.general.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No hay sesiones aún.</div>
                  ) : (
                    sessionsByKind.general.map((s) => {
                      const isActive = active?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setActiveSession("general", s.id);
                            setIsSessionsOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter" && e.key !== " ") return;
                            e.preventDefault();
                            setActiveSession("general", s.id);
                            setIsSessionsOpen(false);
                          }}
                          className={[
                            "w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors",
                            isActive ? "bg-blue-50" : "bg-white",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                              <p className="text-[11px] text-slate-500 mt-1">{formatTime(s.updatedAt)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(s.id);
                              }}
                              className="text-slate-400 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M3 6h18" />
                                <path d="M8 6V4h8v2" />
                                <path d="M19 6l-1 14H6L5 6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>

              <div className="flex-1 min-w-0 flex flex-col bg-white">
                <div className="flex-1 p-5 overflow-y-auto overflow-x-hidden bg-slate-50/50 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white/70 backdrop-blur px-4 py-3 text-[12px] text-slate-600 shadow-sm chat-enter-up">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 w-7 h-7 rounded-xl bg-[#294266]/10 text-[#294266] flex items-center justify-center shrink-0">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                      </div>
                      <div className="leading-relaxed">
                        <span className="font-semibold text-slate-800">Estado:</span>{" "}
                        <span className={botStatus.tone === "danger" ? "text-red-700" : botStatus.tone === "warning" ? "text-amber-700" : botStatus.tone === "ok" ? "text-emerald-700" : "text-slate-700"}>
                          {botStatus.label}
                        </span>
                        <span className="text-slate-500"> · {botStatus.detail}</span>
                      </div>
                    </div>
                  </div>

                  {!active ? (
                    <div className="text-slate-500 text-sm">Crea una nueva sesión para comenzar.</div>
                  ) : messages.length === 0 ? (
                    <div className="text-slate-500 text-sm">
                      Escribe tu primera pregunta. Se mantendrá el historial para conservar el contexto.
                    </div>
                  ) : (
                    messages.map((m, idx) => {
                      const isUser = m.role === "user";
                      const isLast = idx === messages.length - 1;
                      const showTyping = m.role === "assistant" && isStreaming && isLast && m.content.trim().length === 0;
                      return (
                        <div key={`${idx}-${m.role}`} className={isUser ? "flex min-w-0 justify-end" : "flex min-w-0 justify-start"}>
                          <div
                            className={[
                              "w-fit max-w-full max-w-[900px] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border whitespace-pre-wrap break-words [overflow-wrap:anywhere] chat-enter",
                              isUser
                                ? "bg-[#294266] text-white border-[#294266] chat-enter-right"
                                : "bg-white text-slate-800 border-slate-100 chat-enter-left",
                            ].join(" ")}
                          >
                            {showTyping ? (
                              <span className="inline-flex items-center gap-1.5 text-slate-400">
                                <span className="inline-flex gap-1">
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                                </span>
                              </span>
                            ) : (
                              m.content || (m.role === "assistant" && isStreaming ? "…" : "")
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={scrollRef} />
                </div>

                {errorMsg ? (
                  <div className="px-5 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">{errorMsg}</div>
                ) : null}

                <div className="p-4 border-t border-slate-200 bg-white">
                  <div className="flex gap-3 items-end">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        const ne = e.nativeEvent as KeyboardEvent & { isComposing?: boolean };
                        if (ne.isComposing) return;
                        if (e.key !== "Enter") return;
                        if (e.shiftKey) return;
                        e.preventDefault();
                        void send();
                      }}
                      rows={1}
                      placeholder="Escribe tu mensaje… (Enter para enviar, Shift+Enter para salto de línea)"
                      className="flex-1 min-h-[44px] max-h-[160px] resize-none bg-[#f3f6fc] text-slate-800 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                      disabled={isStreaming || !canUseModel}
                    />
                    <Button onClick={send} disabled={isStreaming || input.trim().length === 0 || !canUseModel}>
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

