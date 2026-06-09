// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     CvBuilderPage.tsx                                       ║
// ║ Módulo:      frontend/src/pages/cv-builder/ui                        ║
// ║ Descripción: Generador de CV (UI mock) con chat guiado y vista previa║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Link } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";
import { createOllamaClient } from "@/shared/api/ollama/client";
import type { OllamaMessage } from "@/shared/api/ollama/types";

type ChatSender = "bot" | "user";

type ChatMessage = {
  id: string;
  sender: ChatSender;
  text: string;
};

type CvTheme = "slate" | "blue" | "emerald" | "indigo";

type EducationItem = {
  title: string;
  org: string;
  period: string;
};

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

/**
 * Genera un id simple para mensajes de chat/elementos de UI.
 */
function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Retorna clases utilitarias según el tema del CV.
 */
function themeClasses(theme: CvTheme) {
  if (theme === "blue") {
    return { border: "border-blue-600", title: "text-blue-600" };
  }
  if (theme === "emerald") {
    return { border: "border-emerald-600", title: "text-emerald-600" };
  }
  if (theme === "indigo") {
    return { border: "border-indigo-600", title: "text-indigo-600" };
  }
  return { border: "border-slate-900", title: "text-slate-900" };
}

function themeDotClass(active: boolean, base: string) {
  return [
    "w-5 h-5 rounded-full transition-all cursor-pointer",
    "hover:scale-110",
    active ? "ring-2 ring-offset-2 ring-[#294266] border-2 border-white shadow-md" : "border-2 border-transparent opacity-80 hover:opacity-100",
    base,
  ].join(" ");
}

function splitTip(text: string) {
  const marker = "Tip de Experto";
  const idx = text.indexOf(marker);
  if (idx === -1) return { main: text, tip: null as string | null };
  const main = text.slice(0, idx).trim();
  const tip = text.slice(idx).trim();
  return { main, tip: tip || null };
}

/**
 * Página de generación/edición de CV basada en mock.
 */
export function CvBuilderPage() {
  const session = useSession();
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const ollama = useMemo(() => createOllamaClient(), []);
  const aiAbortRef = useRef<AbortController | null>(null);
  const lastAiMessageIdRef = useRef<string | null>(null);
  const didInitialAiRef = useRef(false);
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [theme, setTheme] = useState<CvTheme>("slate");
  const [chatInput, setChatInput] = useState("");
  const [flowStep, setFlowStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const defaultName = session.userName ? `${session.userName} Ruiz` : "Carlos Ruiz";

  const [cvName, setCvName] = useState(defaultName);
  const [cvLocation, setCvLocation] = useState("Madrid, España");
  const [cvEmail, setCvEmail] = useState("carlos.ruiz@email.com");
  const [cvLinkedIn, setCvLinkedIn] = useState("linkedin.com/in/cruiz");

  const [cvProfile, setCvProfile] = useState<string | null>(null);
  const [cvExperienceTitle, setCvExperienceTitle] = useState("Director de Proyectos Senior");
  const [cvCompany, setCvCompany] = useState("Empresa Actual S.A.");
  const [cvPeriod, setCvPeriod] = useState("2021 — Presente");
  const [cvExperienceBullets, setCvExperienceBullets] = useState<string[]>([
    "Lideré un equipo de 15 personas para la implementación de metodologías ágiles.",
  ]);

  const [education, setEducation] = useState<EducationItem[]>([
    {
      title: "Grado en Administración de Empresas",
      org: "Universidad Complutense de Madrid",
      period: "2014 — 2018",
    },
  ]);

  const initialMessages = useMemo<ChatMessage[]>(
    () => [
      {
        id: makeId(),
        sender: "bot",
        text:
          "¡Hola! Soy tu co-piloto de FirsTep. Vamos a crear un currículum que destaque. Para empezar, ¿cuál es tu nombre completo y en qué ciudad te encuentras?",
      },
      {
        id: makeId(),
        sender: "user",
        text: "Me llamo Carlos Ruiz y vivo en Madrid, España.",
      },
      {
        id: makeId(),
        sender: "bot",
        text:
          "¡Perfecto! He actualizado tu información de contacto. Ahora, cuéntame sobre tu última experiencia profesional. ¿Cuál fue tu cargo y qué hacías?\n\nTip de Experto (ATS): Usa verbos de acción como 'Lideré', 'Desarrollé' o 'Aumenté'. Los sistemas ATS buscan resultados cuantificables.",
      },
    ],
    [],
  );

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  async function generateCvFromChat(chat: ChatMessage[]) {
    aiAbortRef.current?.abort();
    const abort = new AbortController();
    aiAbortRef.current = abort;

    setIsGeneratingCv(true);
    try {
      const transcript = chat
        .map((m) => `${m.sender === "user" ? "Usuario" : "Asistente"}: ${m.text}`)
        .join("\n\n");

      const prompt = [
        "A partir de este chat, genera mejoras para la VISTA PREVIA de un CV.",
        "Devuelve SOLO un JSON válido (sin markdown) con estas claves opcionales:",
        "- name: string",
        "- location: string",
        "- profile: string (3-5 líneas, estilo ATS, en español)",
        "- experience: { title: string, company: string, period: string, bullets: string[] }",
        "- education: Array<{ title: string, org: string, period: string }>",
        "",
        "Reglas:",
        "- No inventes email o LinkedIn si no aparecen en el chat.",
        "- Si no hay datos suficientes para una sección, omítela.",
        "",
        "CV actual (contacto):",
        `name=${cvName}`,
        `location=${cvLocation}`,
        `email=${cvEmail}`,
        `linkedin=${cvLinkedIn}`,
        "",
        "Chat:",
        transcript,
      ].join("\n");

      const msgs: OllamaMessage[] = [
        {
          role: "system",
          content: "Eres un asistente experto en redacción de CVs y ATS. Responde solo con JSON válido.",
        },
        { role: "user", content: prompt },
      ];

      let raw = "";
      await ollama.streamChat({
        model: "llama3.1",
        messages: msgs,
        signal: abort.signal,
        onToken: (t) => {
          raw += t;
        },
      });

      const jsonText = extractJsonObject(raw) ?? raw.trim();
      const parsed = JSON.parse(jsonText) as any;

      if (typeof parsed?.name === "string" && parsed.name.trim()) setCvName(parsed.name.trim());
      if (typeof parsed?.location === "string" && parsed.location.trim()) setCvLocation(parsed.location.trim());
      if (typeof parsed?.profile === "string" && parsed.profile.trim()) setCvProfile(parsed.profile.trim());

      const exp = parsed?.experience;
      if (exp && typeof exp === "object") {
        if (typeof exp.title === "string" && exp.title.trim()) setCvExperienceTitle(exp.title.trim());
        if (typeof exp.company === "string" && exp.company.trim()) setCvCompany(exp.company.trim());
        if (typeof exp.period === "string" && exp.period.trim()) setCvPeriod(exp.period.trim());
        if (Array.isArray(exp.bullets)) {
          const bullets = exp.bullets.map((b: unknown) => (typeof b === "string" ? b.trim() : "")).filter(Boolean);
          if (bullets.length) setCvExperienceBullets(bullets);
        }
      }

      if (Array.isArray(parsed?.education)) {
        const edu = parsed.education
          .map((e: any) => ({
            title: typeof e?.title === "string" ? e.title.trim() : "",
            org: typeof e?.org === "string" ? e.org.trim() : "",
            period: typeof e?.period === "string" ? e.period.trim() : "",
          }))
          .filter((e: EducationItem) => e.title && e.org && e.period);
        if (edu.length) setEducation(edu);
      }
    } catch {
      if (abort.signal.aborted) return;
    } finally {
      if (aiAbortRef.current === abort) aiAbortRef.current = null;
      setIsGeneratingCv(false);
    }
  }

  const quickActions = useMemo(() => {
    if (flowStep === 0) {
      return ["Añadir Experiencia", "Omitir por ahora", "Ver sugerencias de cargo"];
    }
    if (flowStep === 1) {
      return ["¡Me encanta! Conservar", "Modificar algunos verbos"];
    }
    if (flowStep === 2) {
      return ["Añadir Certificación SCRUM", "Descargar mi currículum ahora"];
    }
    return [];
  }, [flowStep]);

  const flowMeta = useMemo(() => {
    if (flowStep === 0) return { label: "Experiencia", progress: 33 };
    if (flowStep === 1) return { label: "Optimización ATS", progress: 66 };
    if (flowStep === 2) return { label: "Detalles finales", progress: 100 };
    return { label: "Conversación", progress: 50 };
  }, [flowStep]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!didInitialAiRef.current) {
      didInitialAiRef.current = true;
      void generateCvFromChat(messages);
      return;
    }
    const last = messages[messages.length - 1];
    if (!last || last.sender !== "user") return;
    if (lastAiMessageIdRef.current === last.id) return;
    lastAiMessageIdRef.current = last.id;
    void generateCvFromChat(messages);
  }, [messages]);

  function appendMessage(sender: ChatSender, text: string) {
    setMessages((prev) => [...prev, { id: makeId(), sender, text }]);
  }

  function processResponse(inputText: string) {
    const lower = inputText.toLowerCase();

    if (flowStep === 0) {
      if (lower.includes("omitir")) {
        appendMessage(
          "bot",
          "Entendido. Cuéntame entonces, ¿qué objetivos te gustaría lograr en tu próximo rol corporativo?",
        );
        setFlowStep(10);
        return;
      }

      appendMessage(
        "bot",
        "¡Excelente! He analizado tu experiencia. He redactado un extracto profesional optimizado para sistemas ATS. ¿Qué opinas de estos puntos clave para tu experiencia?",
      );
      setFlowStep(1);
      return;
    }

    if (flowStep === 1) {
      appendMessage(
        "bot",
        "¡Asombroso! Tu perfil y experiencia ya están validados y optimizados. ¿Deseas que añadamos alguna certificación o idioma antes de proceder a la descarga?",
      );
      setFlowStep(2);
      return;
    }

    if (flowStep === 2) {
      if (lower.includes("descargar")) {
        appendMessage(
          "bot",
          "¡Perfecto! Todo está listo. Haz clic en el botón 'Descargar PDF' en la vista previa para exportar tu currículum.",
        );
        window.print();
        return;
      }

      appendMessage(
        "bot",
        "¡Certificación agregada con éxito! He estructurado la sección de credenciales de forma óptima. Ahora puedes proceder a su descarga.",
      );
      setEducation((prev) => [
        ...prev,
        {
          title: "Certificado de Scrum Master (PSM I)",
          org: "Scrum.org",
          period: "2023",
        },
      ]);
    }
  }

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage("user", trimmed);
    setChatInput("");
    setIsTyping(true);

    window.setTimeout(() => {
      setIsTyping(false);
      processResponse(trimmed);
    }, 900);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(chatInput);
  }

  const colors = themeClasses(theme);

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-[#f8fafc] text-slate-800 print:bg-white">
      <style>{`
@media print {
  body { background: white !important; }
  .no-print { display: none !important; }
  .print-cv { display: block !important; }
  .print-cv-sheet { box-shadow: none !important; border: 0 !important; }
}`}</style>

      <header className="no-print bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
            F
          </div>
          <div>
            <span className="font-bold text-[#1e293b] text-sm block leading-none">FirsTep AI</span>
            <span className="text-[9px] text-slate-400 font-semibold tracking-wider">
              CAREER CO-PILOT
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                !isPreviewOpen ? "bg-white text-[#1e3456] shadow-sm" : "text-slate-500",
              ].join(" ")}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className={[
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5",
                isPreviewOpen ? "bg-white text-[#1e3456] shadow-sm" : "text-slate-500",
              ].join(" ")}
            >
              CV
              {isGeneratingCv ? <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" /> : null}
            </button>
          </div>
          <button type="button" onClick={() => setIsSidebarOpen(true)} className="text-slate-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <aside
          className={[
            "no-print flex-col w-64 bg-white border-r border-slate-200 h-full shrink-0 z-40 transition-all duration-300",
            "fixed lg:relative",
            isSidebarOpen ? "flex" : "hidden lg:flex",
          ].join(" ")}
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                FT
              </div>
              <div>
                <span className="font-bold text-[#1e3456] text-base block leading-none">FirsTep AI</span>
                <span className="text-[9px] text-slate-400 font-bold tracking-widest block mt-0.5">
                  CAREER CO-PILOT
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-slate-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" x2="6" y1="6" y2="18" />
                <line x1="6" x2="18" y1="6" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <Link
              to={routes.dashboard}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              Vista General
            </Link>

            <button
              type="button"
              className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold text-blue-600 bg-blue-50 rounded-xl transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Currículum AI
            </button>
          </nav>
        </aside>

        <section className="no-print flex-1 flex flex-col bg-white border-r border-slate-200 h-full overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-[#1e3456] text-base leading-tight">Constructor de CV AI</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Asistente en línea
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe7f8] bg-[#f7faff] px-2.5 py-1 text-[10px] font-semibold text-[#294266]">
                    <span className="h-1.5 w-20 rounded-full bg-[#dbe7f8] overflow-hidden">
                      <span className="block h-full bg-[linear-gradient(90deg,#294266,#5d85c4)]" style={{ width: `${flowMeta.progress}%` }} />
                    </span>
                    {flowMeta.label}
                  </span>
                  {isGeneratingCv ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                      <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
                      Actualizando vista previa
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(255,255,255,0.85))]">
            <div className="p-6 space-y-5">
            {messages.map((m) => {
              if (m.sender === "user") {
                return (
                  <div key={m.id} className="flex gap-3 items-start max-w-2xl ml-auto justify-end">
                    <div className="bg-[linear-gradient(135deg,#1a2b44,#294266)] text-white rounded-2xl rounded-tr-md p-4 shadow-sm text-sm leading-relaxed border border-white/10">
                      {m.text}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-300 flex items-center justify-center text-slate-700 shrink-0 mt-1 overflow-hidden">
                      <img src="https://i.pravatar.cc/100?img=32" alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                );
              }
              const { main, tip } = splitTip(m.text);
              return (
                <div key={m.id} className="flex gap-3 items-start max-w-2xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
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
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    {main ? (
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-md p-4 shadow-sm text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {main}
                      </div>
                    ) : null}
                    {tip ? (
                      <div className="rounded-2xl border border-[#dbe7f8] bg-[#f7faff] p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white text-[#294266] border border-[#dbe7f8]">
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
                              <path d="M12 2a7 7 0 0 0-4 12c.4.3.7.8.7 1.3V17a1 1 0 0 0 1 1h4.6a1 1 0 0 0 1-1v-1.7c0-.5.3-1 .7-1.3A7 7 0 0 0 12 2Z" />
                              <path d="M9 21h6" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold tracking-widest uppercase text-[#5d7ba6]">Tip ATS</p>
                            <p className="mt-1 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{tip}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {isTyping ? (
              <div className="flex gap-3 items-start max-w-2xl">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 mt-1">
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
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-sm text-slate-400 flex items-center gap-1.5">
                  <span>Pensando</span>
                  <span className="inline-flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                </div>
              </div>
            ) : null}

            {quickActions.length > 0 ? (
              <div className="ml-11 -mr-6 overflow-x-auto pr-6">
                <div className="flex w-max gap-2.5 py-1">
                  {quickActions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => sendMessage(q)}
                      className="bg-white border border-slate-200 text-slate-600 hover:border-[#294266] hover:text-[#294266] px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
            </div>
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={onSubmit} className="flex items-end gap-3 bg-[#f1f5f9] rounded-2xl p-3">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe aquí tu experiencia profesional… (Enter para enviar, Shift+Enter para salto de línea)"
                className="bg-transparent flex-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 px-1 resize-none min-h-[44px] max-h-40 leading-6"
                autoComplete="off"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(chatInput);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="bg-[#294266] disabled:bg-slate-300 disabled:text-slate-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1a2b44] transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Enviar</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" x2="11" y1="2" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>{isGeneratingCv ? "Actualizando vista previa con IA…" : "Consejo: añade resultados medibles (%, $, tiempo)."}</span>
              <span className="hidden sm:inline">{chatInput.trim().length ? `${chatInput.trim().length} caracteres` : ""}</span>
            </div>
          </div>
        </section>

        <section
          className={[
            "print-cv hidden lg:flex w-full lg:w-[450px] xl:w-[500px] flex-col bg-slate-100 h-full overflow-hidden shrink-0 z-30",
            "fixed lg:relative inset-0 lg:inset-auto",
            isPreviewOpen ? "flex" : "hidden lg:flex",
          ].join(" ")}
        >
          <div className="no-print px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                Vista Previa
              </span>
              {isGeneratingCv ? (
                <span className="ml-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  <span className="inline-flex h-3 w-3 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
                  Generando
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-[#1e293b] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                Descargar PDF
              </button>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto flex justify-center items-start">
            <div className="w-full bg-white rounded-2xl shadow-[0_18px_60px_-30px_rgba(15,23,42,0.45)] p-8 text-xs text-slate-700 min-h-[600px] flex flex-col justify-between transition-colors duration-300 print-cv-sheet border border-slate-100">
              <div>
                <div className={["border-b-2 pb-4 mb-5", colors.border].join(" ")}>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{cvName}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {cvLocation}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      {cvEmail}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                        <rect width="4" height="12" x="2" y="9" />
                        <circle cx="4" cy="4" r="2" />
                      </svg>
                      {cvLinkedIn}
                    </span>
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className={["text-[10px] font-bold tracking-widest uppercase mb-2", colors.title].join(" ")}>
                    Perfil Profesional
                  </h4>
                  {cvProfile ? (
                    <div className="bg-white border border-slate-100 rounded-lg p-3 text-[11px] text-slate-600 leading-relaxed">
                      {cvProfile}
                    </div>
                  ) : (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-3 text-[11px] text-slate-500 leading-relaxed italic">
                      {isGeneratingCv
                        ? "Generando perfil optimizado basado en tu chat..."
                        : "Responde en el chat para generar tu perfil profesional."}
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <h4 className={["text-[10px] font-bold tracking-widest uppercase mb-3", colors.title].join(" ")}>
                    Experiencia Laboral
                  </h4>
                  <div className="space-y-4">
                    <div className="relative pl-4 border-l border-slate-100">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-slate-900 text-[11px]">{cvExperienceTitle}</span>
                        <span className="text-[9px] text-slate-400 font-semibold shrink-0">{cvPeriod}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 mb-2">{cvCompany}</p>
                      <ul className="list-disc pl-3 text-[10px] text-slate-600 space-y-1.5 leading-relaxed">
                        {cvExperienceBullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={["text-[10px] font-bold tracking-widest uppercase mb-3", colors.title].join(" ")}>
                    Educación
                  </h4>
                  {education.map((e) => (
                    <div key={`${e.title}-${e.period}`} className="relative pl-4 border-l border-slate-100 mt-3 first:mt-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-slate-900 text-[11px]">{e.title}</span>
                        <span className="text-[9px] text-slate-400 font-semibold">{e.period}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{e.org}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="no-print p-4 bg-white border-t border-slate-200 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diseño:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTheme("slate")}
                  className={themeDotClass(theme === "slate", "bg-slate-900")}
                  title="Clásico Oscuro"
                />
                <button
                  type="button"
                  onClick={() => setTheme("blue")}
                  className={themeDotClass(theme === "blue", "bg-blue-600")}
                  title="Moderno Azul"
                />
                <button
                  type="button"
                  onClick={() => setTheme("emerald")}
                  className={themeDotClass(theme === "emerald", "bg-emerald-600")}
                  title="Elegante Esmeralda"
                />
                <button
                  type="button"
                  onClick={() => setTheme("indigo")}
                  className={themeDotClass(theme === "indigo", "bg-indigo-600")}
                  title="Royal Indigo"
                />
              </div>
            </div>
            <Link to={routes.dashboard} className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              Volver al dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
