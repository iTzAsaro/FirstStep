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

/**
 * Página de generación/edición de CV basada en mock.
 *
 * Nota: este módulo es UI-first y no depende de Ollama; simula un flujo conversacional.
 */
export function CvBuilderPage() {
  const session = useSession();
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
        setCvProfile(
          "Profesional proactivo enfocado en la mejora continua y el liderazgo de proyectos de transformación digital.",
        );
        setFlowStep(10);
        return;
      }

      appendMessage(
        "bot",
        "¡Excelente! He analizado tu experiencia. He redactado un extracto profesional optimizado para sistemas ATS. ¿Qué opinas de estos puntos clave para tu experiencia?",
      );

      setCvProfile(
        "Director de Proyectos Senior experimentado con un historial comprobado en la entrega de proyectos complejos dentro del plazo y presupuesto acordados. Experto en alinear equipos de desarrollo de software con los objetivos de negocio usando metodologías ágiles.",
      );
      setCvExperienceBullets([
        "Lideré un equipo de 15 personas para la implementación de metodologías ágiles, aumentando la velocidad de entrega en un 35%.",
        "Supervisé el presupuesto global de proyectos tecnológicos evaluado en más de $1.2 millones de dólares anuales.",
        "Reduje el tiempo de comercialización (time-to-market) en un 20% mediante automatización de flujos de trabajo.",
      ]);
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
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="text-xs bg-slate-100 text-[#1e3456] px-3 py-1.5 rounded-lg font-semibold border border-slate-200"
          >
            Ver CV
          </button>
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

          <div className="p-4 border-t border-slate-100">
            <div className="bg-gradient-to-b from-[#1e3456] to-[#0f1d33] rounded-2xl p-4 text-white relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[9px] font-bold text-blue-300 uppercase tracking-widest">
                  Plan Actual
                </span>
                <h4 className="font-bold text-sm mt-1">Upgrade to Pro</h4>
                <p className="text-[10px] text-slate-300 mt-2 leading-relaxed">
                  Accede a plantillas exclusivas y análisis de palabras clave ATS ilimitado.
                </p>
                <button
                  type="button"
                  className="w-full bg-white text-[#1e3456] text-xs font-semibold py-2 rounded-lg mt-4 hover:bg-blue-50 transition-colors"
                >
                  Saber Más
                </button>
              </div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl" />
            </div>
          </div>
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    Asistente en Línea
                  </span>
                </div>
              </div>
            </div>
            <span className="bg-[#f0f4f8] text-[#294266] text-[10px] font-bold tracking-wider px-3 py-1.5 rounded-full uppercase border border-[#e2e8f0]">
              ATS Optimized
            </span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-slate-50/50 space-y-6">
            {messages.map((m) => {
              if (m.sender === "user") {
                return (
                  <div key={m.id} className="flex gap-4 items-start max-w-2xl ml-auto justify-end">
                    <div className="bg-[#294266] text-white rounded-2xl p-4 shadow-sm text-sm leading-relaxed">
                      {m.text}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-300 flex items-center justify-center text-slate-700 shrink-0 mt-1 overflow-hidden">
                      <img src="https://i.pravatar.cc/100?img=32" alt="" className="w-full h-full object-cover" />
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex gap-4 items-start max-w-2xl">
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
                  <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {m.text}
                  </div>
                </div>
              );
            })}

            {isTyping ? (
              <div className="flex gap-4 items-start max-w-2xl">
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
              <div className="flex flex-wrap gap-2.5 ml-12">
                {quickActions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => sendMessage(q)}
                    className="bg-white border border-slate-200 text-slate-600 hover:border-[#294266] hover:text-[#294266] px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            <form onSubmit={onSubmit} className="flex items-center gap-3 bg-[#f1f5f9] rounded-2xl p-2.5">
              <button type="button" className="text-slate-400 hover:text-slate-600 p-2 rounded-xl transition-colors">
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
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe aquí tu experiencia profesional..."
                className="bg-transparent flex-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 px-2"
                autoComplete="off"
              />
              <button
                type="submit"
                className="bg-[#294266] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1a2b44] transition-all flex items-center gap-2 shadow-sm"
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
            <div className="w-full bg-white rounded-xl shadow-[0_4px_25px_rgba(0,0,0,0.06)] p-8 text-xs text-slate-700 min-h-[600px] flex flex-col justify-between transition-colors duration-300 print-cv-sheet">
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
                      Generando perfil optimizado basado en tu chat...
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

              <div className="text-center pt-8 border-t border-slate-100 text-[8px] text-slate-300 font-medium tracking-widest uppercase mt-6">
                Creado con FirsTep AI
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
                  className="w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                  title="Clásico Oscuro"
                />
                <button
                  type="button"
                  onClick={() => setTheme("blue")}
                  className="w-5 h-5 rounded-full bg-blue-600 border-2 border-transparent hover:scale-110 transition-transform cursor-pointer"
                  title="Moderno Azul"
                />
                <button
                  type="button"
                  onClick={() => setTheme("emerald")}
                  className="w-5 h-5 rounded-full bg-emerald-600 border-2 border-transparent hover:scale-110 transition-transform cursor-pointer"
                  title="Elegante Esmeralda"
                />
                <button
                  type="button"
                  onClick={() => setTheme("indigo")}
                  className="w-5 h-5 rounded-full bg-indigo-600 border-2 border-transparent hover:scale-110 transition-transform cursor-pointer"
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
