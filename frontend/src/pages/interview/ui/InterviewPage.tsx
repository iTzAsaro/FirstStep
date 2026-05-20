// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     InterviewPage.tsx                                        ║
// ║ Módulo:      frontend/src/pages/interview/ui                          ║
// ║ Descripción: Simulador de entrevistas con Ollama (settings + feedback)║
// ║ Creado:      20-05-2026                                               ║
// ╚═══════════════════════════════════════════════════════════════════════╝

import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";

import { useOllamaSessions } from "@/entities/ollama-session";
import type { InterviewSettings, OllamaSession } from "@/entities/ollama-session";
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
 * Construye el system prompt que configura al modelo como entrevistador.
 */
function makeSystemPrompt(settings: InterviewSettings) {
  return [
    "Eres un entrevistador profesional y estricto, pero justo.",
    `Puesto del candidato: ${settings.role}.`,
    `Tipo de entrevista: ${settings.interviewType}.`,
    `Dificultad: ${settings.difficulty}.`,
    "",
    "Reglas:",
    "- Haz 1 pregunta por turno (la siguiente pregunta debe ir al final).",
    "- Después de cada respuesta del candidato, evalúa con feedback detallado y accionable.",
    "- Mantén el idioma en español.",
    "- Evita información inventada sobre el candidato; si falta contexto, pregunta.",
    "",
    "Formato obligatorio de salida (Markdown):",
    "### Pregunta",
    "(una sola pregunta, clara y concreta)",
    "",
    "### Evaluación",
    "- Puntuación (0-10): X",
    "- Resumen: ...",
    "",
    "### Puntos fuertes",
    "- ...",
    "",
    "### Áreas de mejora",
    "- ...",
    "",
    "### Consejos específicos",
    "- ...",
    "",
    "### Siguiente pregunta",
    "(una sola pregunta)",
  ].join("\n");
}

/**
 * Construye un título legible a partir de los settings de la entrevista.
 */
function buildTitle(settings: InterviewSettings) {
  const role = settings.role.trim() || "Entrevista";
  return `${role} · ${settings.interviewType} · ${settings.difficulty}`;
}

/**
 * Página de simulación de entrevistas.
 *
 * Funcionalidades:
 * - Configuración (puesto, tipo, dificultad, modelo)
 * - Sesiones persistidas en localStorage
 * - Streaming NDJSON token a token
 * - Detener (AbortController)
 * - Reiniciar entrevista conservando el system prompt
 */
export function InterviewPage() {
  const client = useMemo(() => createOllamaClient(), []);
  const {
    sessionsByKind,
    getActiveSession,
    setActiveSession,
    createSession,
    upsertSession,
    resetSessionMessages,
    deleteSession,
  } = useOllamaSessions();

  const [status, setStatus] = useState<
    | { state: "checking" }
    | { state: "ok"; modelAvailable: boolean; models: string[] }
    | { state: "error"; message: string }
  >({ state: "checking" });

  const [model, setModel] = useState(DEFAULT_MODEL);
  const [modelsTick, setModelsTick] = useState(0);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [settings, setSettings] = useState<InterviewSettings>({
    role: "Desarrollador Full Stack",
    interviewType: "mixta",
    difficulty: "mid",
  });

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const active = getActiveSession("interview");
  const messages = active?.messages ?? [];
  const selectedModelAvailable =
    status.state === "ok" ? status.models.some((n) => n.toLowerCase().startsWith(model.toLowerCase())) : false;
  const canUseModel = status.state === "ok" && selectedModelAvailable;

  useEffect(() => {
    let cancelled = false;
    setStatus({ state: "checking" });
    setErrorMsg(null);

    client
      .listModels()
      .then((models) => {
        if (cancelled) return;
        const names = models.map((m) => m.name).filter(Boolean);
        const available = names.some((n) => n.toLowerCase().startsWith(DEFAULT_MODEL));
        setStatus({ state: "ok", modelAvailable: available, models: names });
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
  }, [messages.length, isStreaming]);

  function ensureSession() {
    if (active) return active;
    const systemPrompt = makeSystemPrompt(settings);
    const session = createSession({
      kind: "interview",
      title: buildTitle(settings),
      model,
      interviewSettings: settings,
      messages: [{ role: "system", content: systemPrompt }],
    });
    return session;
  }

  async function startInterview() {
    if (isStreaming) return;
    if (!canUseModel) {
      setErrorMsg(
        status.state !== "ok"
          ? "No se pudo conectar con Ollama. Inicia el servicio e inténtalo de nuevo."
          : `El modelo seleccionado no está disponible. Ejecuta: ollama pull ${model}`,
      );
      return;
    }
    setErrorMsg(null);
    const session = ensureSession();

    if (session.messages.some((m) => m.role === "assistant")) {
      return;
    }

    const nextMessages: OllamaMessage[] = [
      ...session.messages,
      { role: "user", content: "Comienza la entrevista. Haz la primera pregunta." },
      { role: "assistant", content: "" },
    ];
    const assistantIndex = nextMessages.length - 1;

    const updated: OllamaSession = {
      ...session,
      title: buildTitle(settings),
      model,
      interviewSettings: settings,
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
        e instanceof OllamaError ? e.message : e instanceof Error ? e.message : String(e);
      setErrorMsg(message);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  async function sendAnswer() {
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

    const updated: OllamaSession = { ...session, updatedAt: now(), model, messages: nextMessages };
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
        e instanceof OllamaError ? e.message : e instanceof Error ? e.message : String(e);
      setErrorMsg(message);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newInterview() {
    const session = createSession({
      kind: "interview",
      title: buildTitle(settings),
      model,
      interviewSettings: settings,
      messages: [{ role: "system", content: makeSystemPrompt(settings) }],
    });
    setActiveSession("interview", session.id);
    setErrorMsg(null);
  }

  function resetCurrent() {
    if (!active) return;
    const system = active.messages.find((m) => m.role === "system");
    resetSessionMessages(active.id, system ? [system] : []);
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
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400">
              Simulación de entrevistas
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to={routes.chat}>
              <Button variant="secondary" size="sm">
                Chat general
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
                <p className="text-sm font-semibold text-slate-700 mt-1">Entrevistas</p>
              </div>
              <Button size="sm" onClick={newInterview}>
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
                  ) : (
                    <span>
                      Ollama OK · llama3.1{" "}
                      {status.modelAvailable ? (
                        <span className="text-emerald-600 font-semibold">disponible</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">no encontrado</span>
                      )}
                    </span>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={retry} disabled={status.state === "checking" || isStreaming}>
                  Reintentar
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Puesto
                  </label>
                  <input
                    value={settings.role}
                    onChange={(e) => setSettings((p) => ({ ...p, role: e.target.value }))}
                    className="w-full bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent"
                    placeholder="Ej: Desarrollador Full Stack"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Tipo de entrevista
                  </label>
                  <select
                    value={settings.interviewType}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, interviewType: e.target.value as InterviewSettings["interviewType"] }))
                    }
                    className="w-full bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent"
                  >
                    <option value="técnica">Técnica</option>
                    <option value="rrhh">Recursos Humanos</option>
                    <option value="mixta">Mixta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Dificultad
                  </label>
                  <select
                    value={settings.difficulty}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, difficulty: e.target.value as InterviewSettings["difficulty"] }))
                    }
                    className="w-full bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent"
                  >
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                    Modelo
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent"
                  >
                    <option value={DEFAULT_MODEL}>llama3.1 (recomendado)</option>
                    {status.state === "ok"
                      ? status.models
                          .filter((m) => !m.toLowerCase().startsWith(DEFAULT_MODEL))
                          .slice(0, 25)
                          .map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))
                      : null}
                  </select>
                  {status.state === "ok" && status.models.length > 0 && !selectedModelAvailable ? (
                    <p className="text-[11px] text-amber-700 mt-2">
                      El modelo seleccionado no está disponible. Ejecuta: <span className="font-mono">ollama pull {model}</span>
                    </p>
                  ) : null}
                </div>

                <Button
                  onClick={startInterview}
                  disabled={isStreaming || !canUseModel || settings.role.trim().length === 0}
                >
                  Iniciar entrevista
                </Button>
              </div>
            </div>

            <div className="max-h-[45vh] overflow-y-auto">
              {sessionsByKind.interview.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">No hay sesiones aún.</div>
              ) : (
                sessionsByKind.interview.map((s) => {
                  const isActive = active?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveSession("interview", s.id)}
                      onKeyDown={(e) => {
                        if (e.key !== "Enter" && e.key !== " ") return;
                        e.preventDefault();
                        setActiveSession("interview", s.id);
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
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Entrevista</p>
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
                  Configura el puesto, tipo y dificultad; luego inicia la entrevista.
                </div>
              ) : (
                messages
                  .filter((m) => m.role !== "system")
                  .map((m, idx) => {
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
                  placeholder="Escribe tu respuesta…"
                  className="flex-1 min-h-[44px] max-h-[180px] resize-y bg-[#f3f6fc] text-slate-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/30 transition-all text-sm border border-transparent"
                  disabled={!active || isStreaming || !canUseModel}
                />
                <Button onClick={sendAnswer} disabled={!active || isStreaming || input.trim().length === 0 || !canUseModel}>
                  Enviar
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                El entrevistador evalúa tu respuesta y genera la siguiente pregunta. Reinicia para empezar desde cero.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
