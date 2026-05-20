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

  const [model, setModel] = useState(DEFAULT_MODEL);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelsTick, setModelsTick] = useState(0);

  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const active = getActiveSession("general");

  useEffect(() => {
    let cancelled = false;
    setStatus({ state: "checking" });
    setErrorMsg(null);

    client
      .listModels()
      .then((models) => {
        if (cancelled) return;
        const names = models.map((m) => m.name).filter(Boolean);
        setAvailableModels(names);
        const available = names.some((n) => n.toLowerCase().startsWith(DEFAULT_MODEL));
        setStatus({ state: "ok", modelAvailable: available });
      })
      .catch((e) => {
        if (cancelled || isAbortError(e)) return;
        setStatus({ state: "error", message: e instanceof Error ? e.message : String(e) });
      });

    return () => {
      cancelled = true;
    };
  }, [client, modelsTick]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, isStreaming]);

  const messages = active?.messages ?? [];
  const selectedModelAvailable =
    status.state === "ok" ? availableModels.some((n) => n.toLowerCase().startsWith(model.toLowerCase())) : false;
  const canUseModel = status.state === "ok" && selectedModelAvailable;

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

  function retry() {
    setModelsTick((t) => t + 1);
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-4 xl:col-span-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Sesiones</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">Chat general</p>
              </div>
              <Button size="sm" onClick={newChat}>
                Nuevo
              </Button>
            </div>

            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  {status.state === "checking" ? (
                    <span>Conectando con Ollama…</span>
                  ) : status.state === "error" ? (
                    <span className="text-red-600">{status.message}</span>
                  ) : status.state === "ok" ? (
                    <span>
                      Ollama OK · llama3.1{" "}
                      {status.modelAvailable ? (
                        <span className="text-emerald-600 font-semibold">disponible</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">no encontrado</span>
                      )}
                    </span>
                  ) : null}
                </div>
                <Button variant="outline" size="sm" onClick={retry} disabled={status.state === "checking" || isStreaming}>
                  Reintentar
                </Button>
              </div>
              <div className="mt-3">
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Modelo
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent"
                >
                  <option value={DEFAULT_MODEL}>llama3.1 (recomendado)</option>
                  {availableModels
                    .filter((m) => !m.toLowerCase().startsWith(DEFAULT_MODEL))
                    .slice(0, 25)
                    .map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                </select>
                {!availableModels.length && status.state !== "checking" ? (
                  <p className="text-[11px] text-slate-500 mt-2">
                    Si no ves modelos, inicia Ollama y descarga el modelo:{" "}
                    <span className="font-mono">ollama pull llama3.1</span>
                  </p>
                ) : null}
                {status.state === "ok" && availableModels.length > 0 && !selectedModelAvailable ? (
                  <p className="text-[11px] text-amber-700 mt-2">
                    El modelo seleccionado no está disponible. Ejecuta: <span className="font-mono">ollama pull {model}</span>
                  </p>
                ) : null}
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
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
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{s.title}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {s.model} · {formatTime(s.updatedAt)}
                          </p>
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

          <section className="lg:col-span-8 xl:col-span-9 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[70vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Conversación</p>
                <p className="text-sm font-semibold text-slate-700 mt-1">
                  {active ? active.title : "Selecciona o crea una sesión"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={resetCurrent} disabled={!active || isStreaming}>
                  Reiniciar
                </Button>
                <Button variant="secondary" size="sm" onClick={stop} disabled={!isStreaming}>
                  Detener
                </Button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-slate-50/50 space-y-4">
              {!active ? (
                <div className="text-slate-500 text-sm">
                  Crea una nueva sesión para comenzar.
                </div>
              ) : messages.length === 0 ? (
                <div className="text-slate-500 text-sm">
                  Escribe tu primera pregunta. Se mantendrá el historial para conservar el contexto.
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={`${idx}-${m.role}`} className={isUser ? "flex justify-end" : "flex justify-start"}>
                      <div
                        className={[
                          "max-w-[900px] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border whitespace-pre-wrap",
                          isUser
                            ? "bg-[#294266] text-white border-[#294266]"
                            : "bg-white text-slate-800 border-slate-100",
                        ].join(" ")}
                      >
                        {m.content || (m.role === "assistant" && isStreaming ? "…" : "")}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={scrollRef} />
            </div>

            {errorMsg ? (
              <div className="px-5 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
                {errorMsg}
              </div>
            ) : null}

            <div className="p-4 border-t border-slate-200 bg-white">
              <div className="flex gap-3 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu mensaje…"
                  className="flex-1 min-h-[44px] max-h-[160px] resize-y bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent"
                  disabled={isStreaming || !canUseModel}
                />
                <Button onClick={send} disabled={isStreaming || input.trim().length === 0 || !canUseModel}>
                  Enviar
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Usa Ollama local. Si falla la conexión, verifica que el servicio esté corriendo en{" "}
                <span className="font-mono">http://localhost:11434</span>.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

