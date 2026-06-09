// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     LandingPage.tsx                                         ║
// ║ Módulo:      frontend/src/pages/landing/ui                           ║
// ║ Descripción: Landing pública con secciones informativas y accesos.   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useEffect, useMemo, useRef, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { Button, Input } from "@/shared/ui";

/**
 * Renderiza la página de inicio pública (marketing) con anclas de navegación y
 * accesos a login/registro para talento y empresas.
 */
export function LandingPage() {
  const navigate = useNavigate();
  const registerSectionRef = useRef<HTMLElement | null>(null);

  const abVariant = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("ab");
    if (override === "A" || override === "B") return override;
    const key = "firststep.ab.landing.v1";
    const stored = localStorage.getItem(key);
    if (stored === "A" || stored === "B") return stored;
    const v = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(key, v);
    return v;
  }, []);

  const copy = useMemo(() => {
    if (abVariant === "B") {
      return {
        heroTitle: (
          <>
            Convierte tu{" "}
            <span className="text-[#0ea5e9]">perfil</span> en entrevistas con un plan claro.
          </>
        ),
        heroSubtitle:
          "FirstStep te guía paso a paso: perfil sólido, CV listo para enviar y seguimiento para no perder oportunidades.",
        primaryCta: "Quiero mi acceso",
      };
    }

    return {
      heroTitle: (
        <>
          Tu primer paso para{" "}
          <span className="text-[#22c55e]">conseguir</span> oportunidades reales.
        </>
      ),
      heroSubtitle:
        "FirstStep reúne onboarding, CV y seguimiento en una experiencia simple para talento y empresas: más señal, menos ruido.",
      primaryCta: "Unirme ahora",
    };
  }, [abVariant]);

  const ctaClasses = useMemo(() => {
    return abVariant === "B"
      ? "bg-[#0ea5e9] hover:bg-[#0284c7] shadow-[0_16px_40px_-18px_rgba(14,165,233,0.65)]"
      : "bg-[#22c55e] hover:bg-[#16a34a] shadow-[0_16px_40px_-18px_rgba(34,197,94,0.65)]";
  }, [abVariant]);

  const [leadEmail, setLeadEmail] = useState("");
  const [leadRole, setLeadRole] = useState<"talento" | "empresa">("talento");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const leadEmailOk = useMemo(() => {
    const v = leadEmail.trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, [leadEmail]);

  const earlyAccess = useMemo(() => {
    const limit = 100;
    const endsAt = new Date("2026-07-01T00:00:00.000Z").getTime();
    return { limit, endsAt };
  }, []);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const signupsKey = "firststep.landing.signups.v1";
  const signupEventsKey = "firststep.landing.signupEvents.v1";

  const getSignupCount = () => {
    const raw = localStorage.getItem(signupsKey);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  };

  const [localSignups, setLocalSignups] = useState(() => getSignupCount());

  const remainingSpots = useMemo(() => {
    return Math.max(0, earlyAccess.limit - localSignups);
  }, [earlyAccess.limit, localSignups]);

  const countdown = useMemo(() => {
    const ms = Math.max(0, earlyAccess.endsAt - now);
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return { ms, days, hours, mins, secs };
  }, [earlyAccess.endsAt, now]);

  const recentSignups = useMemo(() => {
    try {
      const raw = localStorage.getItem(signupEventsKey);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      const list = Array.isArray(arr) ? (arr as number[]).filter((n) => Number.isFinite(n)) : [];
      const cutoff = now - 15 * 60 * 1000;
      return list.filter((t) => t >= cutoff).length;
    } catch {
      return 0;
    }
  }, [now]);

  useEffect(() => {
    const key = "firststep.analytics.landing.v1";
    try {
      const raw = localStorage.getItem(key);
      const list = raw ? (JSON.parse(raw) as any[]) : [];
      const out = Array.isArray(list) ? list : [];
      out.push({ at: Date.now(), event: "landing_view", ab: abVariant });
      localStorage.setItem(key, JSON.stringify(out.slice(-200)));
    } catch {
      // Ignorar
    }
  }, [abVariant]);

  const scrollToRegister = () => {
    const el = registerSectionRef.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const track = (event: string, data?: Record<string, unknown>) => {
    const key = "firststep.analytics.landing.v1";
    try {
      const raw = localStorage.getItem(key);
      const list = raw ? (JSON.parse(raw) as any[]) : [];
      const out = Array.isArray(list) ? list : [];
      out.push({ at: Date.now(), event, ab: abVariant, ...data });
      localStorage.setItem(key, JSON.stringify(out.slice(-200)));
    } catch {
      // Ignorar
    }
  };

  const recordSignupEvent = () => {
    try {
      const raw = localStorage.getItem(signupEventsKey);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      const out = Array.isArray(list) ? (list as number[]) : [];
      out.push(Date.now());
      localStorage.setItem(signupEventsKey, JSON.stringify(out.slice(-300)));
    } catch {
      // Ignorar
    }
  };

  const bumpLocalSignupCount = () => {
    const next = getSignupCount() + 1;
    localStorage.setItem(signupsKey, String(next));
    setLocalSignups(next);
    recordSignupEvent();
  };

  const goToFullSignUp = (role: "talento" | "empresa", email?: string) => {
    const to = role === "empresa" ? routes.companySignUp : routes.talentSignUp;
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    track("cta_go_to_signup", { role });
    navigate(`${to}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const [demoStep, setDemoStep] = useState<"perfil" | "cv" | "seguimiento">("perfil");
  const introVideoUrl = useMemo(() => {
    return localStorage.getItem("firststep.landing.introVideoUrl") ?? "";
  }, []);
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const testimonials = useMemo(() => {
    const key = "firststep.landing.testimonials.v1";
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      const list = Array.isArray(parsed) ? (parsed as any[]) : [];
      return list
        .map((t) => {
          const quote = typeof t?.quote === "string" ? t.quote.trim() : "";
          const name = typeof t?.name === "string" ? t.name.trim() : "";
          const role = typeof t?.role === "string" ? t.role.trim() : "";
          const company = typeof t?.company === "string" ? t.company.trim() : "";
          if (!quote || !name) return null;
          return { quote, name, role, company };
        })
        .filter(Boolean)
        .slice(0, 6) as { quote: string; name: string; role: string; company: string }[];
    } catch {
      return [];
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <span
                className="inline-flex items-center gap-2 rounded-full bg-slate-100 border border-slate-200 px-3 py-1"
                role="status"
                aria-live="polite"
              >
                <span className="font-bold text-slate-900">Early access</span>
                <span className="text-slate-400">•</span>
                <span>
                  Quedan <span className="font-bold text-slate-900">{remainingSpots}</span> de {earlyAccess.limit}
                </span>
                <span className="text-slate-400">•</span>
                <span className="tabular-nums">
                  {String(countdown.days).padStart(2, "0")}:{String(countdown.hours).padStart(2, "0")}:
                  {String(countdown.mins).padStart(2, "0")}:{String(countdown.secs).padStart(2, "0")}
                </span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-2 text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {recentSignups} registro{recentSignups === 1 ? "" : "s"} en los últimos 15 min (este dispositivo)
              </span>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">A/B: {abVariant}</span>
              <a href="#faq" className="rounded-full border border-slate-200 bg-white px-3 py-1 hover:bg-slate-50">
                FAQ
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={routes.home} className="font-bold text-[#1e3456] text-xl tracking-tight">
            FirstStep
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#funcionalidades" className="hover:text-slate-900 transition-colors">
              Funcionalidades
            </a>
            <a href="#casos" className="hover:text-slate-900 transition-colors">
              Casos de uso
            </a>
            <a href="#video" className="hover:text-slate-900 transition-colors">
              Video
            </a>
            <a href="#demo" className="hover:text-slate-900 transition-colors">
              Demo
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to={routes.portal} className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="rounded-full px-4">
                Portal
              </Button>
            </Link>
            <Button
              size="sm"
              className={["rounded-full px-5 text-white", ctaClasses].join(" ")}
              onClick={() => {
                track("cta_nav_primary");
                scrollToRegister();
              }}
            >
              {copy.primaryCta}
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
          <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[#111827] text-[11px] font-bold tracking-widest uppercase">
                Entra en la beta
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                cupos limitados
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-[#0f172a] leading-[1.05]">
                {copy.heroTitle}
              </h1>
              <p className="mt-5 text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
                {copy.heroSubtitle}
              </p>

              <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[
                  { label: "CV y perfil claros", desc: "Lo esencial primero." },
                  { label: "Seguimiento simple", desc: "No pierdas oportunidades." },
                  { label: "Para talento y empresas", desc: "Un lenguaje común." },
                ].map((b) => (
                  <div key={b.label} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                    <p className="font-semibold text-slate-900">{b.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{b.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <Button
                  className={["w-full sm:w-auto rounded-full px-8 py-4 text-white", ctaClasses].join(" ")}
                  onClick={() => {
                    track("cta_hero_primary");
                    scrollToRegister();
                  }}
                >
                  {copy.primaryCta}
                </Button>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-full px-8 py-4 border-slate-300"
                  onClick={() => {
                    track("cta_hero_company");
                    goToFullSignUp("empresa", leadEmailOk ? leadEmail.trim() : undefined);
                  }}
                >
                  Soy empresa
                </Button>
              </div>

              <div className="mt-4 text-sm text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
                <span>¿Ya tienes cuenta?</span>
                <Link to={routes.login} className="font-semibold text-[#0f172a] hover:underline">
                  Login talento
                </Link>
                <span className="text-slate-300">/</span>
                <Link to={routes.companyLogin} className="font-semibold text-[#0f172a] hover:underline">
                  Login empresa
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_-22px_rgba(2,6,23,0.25)] overflow-hidden">
                <div className="px-7 py-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                      Registro rápido
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#0f172a]">Empieza en menos de 30 segundos</p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                    Quedan {remainingSpots}/{earlyAccess.limit}
                  </span>
                </div>
                <div className="p-7">
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitAttempted(true);
                      track("lead_submit_inline", { role: leadRole });
                      if (!leadEmailOk) return;
                      bumpLocalSignupCount();
                      goToFullSignUp(leadRole, leadEmail.trim());
                    }}
                  >
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                        Email
                      </label>
                      <Input
                        type="email"
                        placeholder="tu@correo.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        aria-invalid={(submitAttempted && !leadEmailOk) || undefined}
                        className={[
                          "bg-[#f3f5f8] rounded-xl placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                          submitAttempted && !leadEmailOk ? "ring-2 ring-red-200" : null,
                        ].join(" ")}
                      />
                      {submitAttempted && !leadEmailOk ? (
                        <p className="mt-2 text-[11px] text-red-700">Ingresa un correo válido.</p>
                      ) : null}
                    </div>

                    <fieldset className="rounded-2xl border border-slate-200 bg-slate-50/40 p-4">
                      <legend className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                        Tipo de cuenta
                      </legend>
                      <div className="mt-2">
                        <div className="relative grid grid-cols-2 rounded-full bg-white border border-slate-200 p-1">
                          <div
                            aria-hidden="true"
                            className={[
                              "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-slate-900 shadow-sm transition-transform duration-300 ease-out",
                              leadRole === "empresa" ? "translate-x-full" : "translate-x-0",
                            ].join(" ")}
                          />
                        {[
                          { value: "talento" as const, label: "Promesas", hint: "Perfil + CV + seguimiento" },
                          { value: "empresa" as const, label: "Empresa", hint: "Dashboard + gestión" },
                        ].map((o) => (
                          <label
                            key={o.value}
                            className={[
                              "relative z-10 cursor-pointer rounded-full px-4 py-3 transition-all duration-300 ease-out focus-within:ring-2 focus-within:ring-slate-900/15",
                              leadRole === o.value ? "text-white" : "text-slate-700 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <input
                              type="radio"
                              name="leadRole"
                              value={o.value}
                              checked={leadRole === o.value}
                              onChange={() => setLeadRole(o.value)}
                              className="sr-only"
                            />
                            <p className={["font-semibold", leadRole === o.value ? "text-white" : "text-slate-900"].join(" ")}>
                              {o.label}
                            </p>
                            <p className={["mt-1 text-xs", leadRole === o.value ? "text-white/80" : "text-slate-500"].join(" ")}>
                              {o.hint}
                            </p>
                          </label>
                        ))}
                        </div>
                      </div>
                    </fieldset>

                    <Button type="submit" className={["w-full rounded-full py-4 text-white", ctaClasses].join(" ")}>
                      Continuar registro
                    </Button>

                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Solo usamos tu email para crear tu cuenta. Podrás completar el resto dentro del registro.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                Funcionalidades
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
                Todo lo necesario para convertir intención en acción.
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl">
                Un producto pensado para ventas: claridad, confianza y un registro sin fricción.
              </p>
            </div>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                track("cta_features_to_register");
                scrollToRegister();
              }}
            >
              Ver registro rápido
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Onboarding guiado",
                desc: "Estructura tu perfil sin perder tiempo: lo que importa primero.",
                icon: (
                  <path d="M3 4h18v4H3V4Zm0 6h18v10H3V10Zm4 3h10" />
                ),
              },
              {
                title: "CV y contenido listo",
                desc: "Itera tu CV con versiones, títulos claros y contenido reutilizable.",
                icon: <path d="M7 3h10v18H7V3Zm2 4h6M9 11h6M9 15h4" />,
              },
              {
                title: "Seguimiento de postulaciones",
                desc: "Centraliza tu pipeline y evita que se te escape una oportunidad.",
                icon: <path d="M4 7h16M4 12h10M4 17h16" />,
              },
              {
                title: "Chat y entrevistas (opcional)",
                desc: "Practica preguntas y genera borradores con asistencia cuando lo necesites.",
                icon: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
              },
              {
                title: "Roles claros",
                desc: "Experiencias separadas para talento y empresa, sin ambigüedad.",
                icon: <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M19 21v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-4-4h-1" />,
              },
              {
                title: "Seguridad por diseño",
                desc: "Contraseñas hasheadas, JWT y validaciones para reducir riesgo.",
                icon: <path d="M12 2 4 6v6c0 5 3.4 9.7 8 10 4.6-.3 8-5 8-10V6l-8-4Zm0 6v6m0 4h.01" />,
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-[2rem] border border-slate-200 p-7 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
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
                    aria-hidden="true"
                  >
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#0f172a]">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="casos" className="bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                  Casos de uso
                </p>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
                  Hecho para resolver problemas reales.
                </h2>
                <p className="mt-3 text-slate-600 max-w-2xl">
                  Dos flujos, una propuesta: decisiones más rápidas con información más clara.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="rounded-full border-slate-300"
                  onClick={() => {
                    track("cta_usecases_talent");
                    goToFullSignUp("talento", leadEmailOk ? leadEmail.trim() : undefined);
                  }}
                >
                  Soy talento
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-slate-300"
                  onClick={() => {
                    track("cta_usecases_company");
                    goToFullSignUp("empresa", leadEmailOk ? leadEmail.trim() : undefined);
                  }}
                >
                  Soy empresa
                </Button>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  title: "Talento: postular sin caos",
                  bullets: [
                    "Convierte tu historial en un perfil ordenado y presentable.",
                    "Mantén un CV actualizado sin reinventarlo cada vez.",
                    "Sigue tus postulaciones en un solo lugar.",
                  ],
                  cta: "Crear cuenta talento",
                  onClick: () => goToFullSignUp("talento", leadEmailOk ? leadEmail.trim() : undefined),
                },
                {
                  title: "Empresa: más señal en el funnel",
                  bullets: [
                    "Accede a perfiles con estructura y contexto.",
                    "Reduce idas y vueltas con información clave visible.",
                    "Gestiona procesos con un dashboard consistente.",
                  ],
                  cta: "Crear cuenta empresa",
                  onClick: () => goToFullSignUp("empresa", leadEmailOk ? leadEmail.trim() : undefined),
                },
              ].map((c) => (
                <div key={c.title} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-[#0f172a]">{c.title}</h3>
                  <ul className="mt-5 space-y-3 text-sm text-slate-600">
                    {c.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3">
                        <span className="mt-1 w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7">
                    <Button
                      className={["rounded-full px-7 text-white", ctaClasses].join(" ")}
                      onClick={() => {
                        track("cta_usecase_primary", { title: c.title });
                        c.onClick();
                      }}
                    >
                      {c.cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonios" className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                Testimonios
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
                Prueba social, solo cuando es verificable.
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl">
                Esta sección está lista para mostrar testimonios reales de clientes pioneros. No publicamos citas sin autorización.
              </p>
            </div>
            <Button
              className={["rounded-full px-7 text-white", ctaClasses].join(" ")}
              onClick={() => {
                track("cta_testimonials_to_register");
                scrollToRegister();
              }}
            >
              {copy.primaryCta}
            </Button>
          </div>

          {testimonials.length ? (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <figure key={`${t.name}-${t.quote.slice(0, 24)}`} className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
                  <blockquote className="text-sm text-slate-700 leading-relaxed">“{t.quote}”</blockquote>
                  <figcaption className="mt-5 text-sm">
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {[t.role, t.company].filter(Boolean).join(" · ")}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed">
                Aún no hay testimonios publicados en esta instalación. Cuando tengas testimonios reales, puedes cargarlos en{" "}
                <span className="font-semibold">localStorage</span> bajo la clave{" "}
                <span className="font-semibold">firststep.landing.testimonials.v1</span>.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  className={["rounded-full px-7 text-white", ctaClasses].join(" ")}
                  onClick={() => {
                    track("cta_testimonials_empty_to_register");
                    scrollToRegister();
                  }}
                >
                  {copy.primaryCta}
                </Button>
                <Link to={routes.portal}>
                  <Button variant="outline" className="rounded-full px-7 border-slate-300">
                    Ver portal
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </section>

        <section id="video" className="bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                  Video
                </p>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
                  Una explicación en 60–90 segundos.
                </h2>
                <p className="mt-3 text-slate-600 max-w-2xl">
                  El landing soporta un video corto de presentación sin penalizar rendimiento: se carga solo cuando el usuario hace clic en reproducir.
                </p>
              </div>
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  track("cta_video_to_register");
                  scrollToRegister();
                }}
              >
                Ir a registro
              </Button>
            </div>

            <div className="mt-10 rounded-[2rem] border border-slate-200 bg-slate-900 overflow-hidden">
              {showIntroVideo && introVideoUrl ? (
                <video className="w-full h-auto" controls preload="metadata">
                  <source src={introVideoUrl} />
                </video>
              ) : (
                <div className="p-10 md:p-14 text-white grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7">
                    <p className="text-xs font-bold tracking-widest uppercase text-white/60">
                      Presentación
                    </p>
                    <h3 className="mt-3 text-2xl md:text-3xl font-bold">
                      Qué es FirstStep y por qué funciona
                    </h3>
                    <p className="mt-3 text-sm text-white/75 leading-relaxed">
                      Para evitar assets pesados en el repositorio, el URL del video se configura por instalación usando{" "}
                      <span className="font-semibold">localStorage</span>:{" "}
                      <span className="font-semibold">firststep.landing.introVideoUrl</span>.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Button
                        className={["rounded-full px-7 text-white", ctaClasses].join(" ")}
                        onClick={() => {
                          track("video_play_click");
                          if (!introVideoUrl) {
                            setShowIntroVideo(false);
                            return;
                          }
                          setShowIntroVideo(true);
                        }}
                      >
                        Reproducir
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full px-7 border-white/30 text-white hover:bg-white/10"
                        onClick={() => {
                          track("video_go_to_demo");
                          document.getElementById("demo")?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                      >
                        Ver demo interactiva
                      </Button>
                    </div>
                  </div>
                  <div className="lg:col-span-5">
                    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                      <div className="aspect-video rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="46"
                          height="46"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          className="text-white/70"
                        >
                          <polygon points="6 3 20 12 6 21 6 3" />
                        </svg>
                      </div>
                      <p className="mt-4 text-xs text-white/60 leading-relaxed">
                        Tip: define un MP4/WEBM optimizado (720p, bitrate moderado) para mantener Lighthouse alto.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="demo" className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                Demo
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
                Mira cómo se ve antes de registrarte.
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl">
                Una demostración interactiva ligera para que entiendas el valor en segundos.
              </p>
            </div>
            <Button
              variant="secondary"
              className="rounded-full"
              onClick={() => {
                track("cta_demo_to_register");
                scrollToRegister();
              }}
            >
              Ir a registro
            </Button>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold tracking-widest uppercase text-slate-400">Tour</p>
              <div className="mt-4 space-y-2">
                {[
                  { id: "perfil" as const, title: "1) Perfil", desc: "Define enfoque y muestra lo esencial." },
                  { id: "cv" as const, title: "2) CV", desc: "Versiona y exporta sin fricción." },
                  { id: "seguimiento" as const, title: "3) Seguimiento", desc: "Pipeline simple y visible." },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={[
                      "w-full text-left rounded-2xl border px-4 py-3 transition-colors",
                      demoStep === s.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50",
                    ].join(" ")}
                    onClick={() => {
                      track("demo_step", { step: s.id });
                      setDemoStep(s.id);
                    }}
                  >
                    <p className="font-semibold">{s.title}</p>
                    <p className={["mt-1 text-xs leading-relaxed", demoStep === s.id ? "text-white/80" : "text-slate-500"].join(" ")}>
                      {s.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <p className="font-bold text-[#0f172a]">Vista previa</p>
                <span className="text-[11px] font-semibold text-slate-500">
                  {demoStep === "perfil" ? "Perfil" : demoStep === "cv" ? "CV" : "Seguimiento"}
                </span>
              </div>
              <div className="p-6 bg-gradient-to-b from-slate-50 to-white">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <svg
                    viewBox="0 0 800 360"
                    width="100%"
                    height="auto"
                    role="img"
                    aria-label="Demostración visual del producto"
                  >
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.18" />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="800" height="360" rx="18" fill="url(#g1)" />
                    <rect x="26" y="26" width="250" height="308" rx="16" fill="#ffffff" opacity="0.9" />
                    <rect x="300" y="26" width="474" height="308" rx="16" fill="#ffffff" opacity="0.9" />
                    <rect x="52" y="56" width="190" height="12" rx="6" fill="#0f172a" opacity="0.75" />
                    <rect x="52" y="82" width="140" height="10" rx="5" fill="#64748b" opacity="0.55" />
                    <rect x="52" y="122" width="200" height="44" rx="12" fill={demoStep === "perfil" ? "#0ea5e9" : "#e2e8f0"} opacity="0.8" />
                    <rect x="52" y="178" width="200" height="44" rx="12" fill={demoStep === "cv" ? "#22c55e" : "#e2e8f0"} opacity="0.8" />
                    <rect x="52" y="234" width="200" height="44" rx="12" fill={demoStep === "seguimiento" ? "#111827" : "#e2e8f0"} opacity="0.8" />

                    {demoStep === "perfil" ? (
                      <>
                        <rect x="330" y="56" width="220" height="16" rx="8" fill="#0f172a" opacity="0.78" />
                        <rect x="330" y="90" width="360" height="10" rx="5" fill="#64748b" opacity="0.5" />
                        <rect x="330" y="132" width="410" height="70" rx="14" fill="#e2e8f0" />
                        <rect x="330" y="220" width="170" height="42" rx="14" fill="#0ea5e9" opacity="0.85" />
                        <rect x="510" y="220" width="230" height="42" rx="14" fill="#e2e8f0" />
                      </>
                    ) : demoStep === "cv" ? (
                      <>
                        <rect x="330" y="56" width="260" height="16" rx="8" fill="#0f172a" opacity="0.78" />
                        <rect x="330" y="90" width="300" height="10" rx="5" fill="#64748b" opacity="0.5" />
                        <rect x="330" y="132" width="410" height="168" rx="14" fill="#e2e8f0" />
                        <rect x="330" y="316" width="180" height="22" rx="11" fill="#22c55e" opacity="0.85" />
                      </>
                    ) : (
                      <>
                        <rect x="330" y="56" width="250" height="16" rx="8" fill="#0f172a" opacity="0.78" />
                        <rect x="330" y="90" width="340" height="10" rx="5" fill="#64748b" opacity="0.5" />
                        <rect x="330" y="132" width="140" height="58" rx="14" fill="#111827" opacity="0.85" />
                        <rect x="482" y="132" width="140" height="58" rx="14" fill="#e2e8f0" />
                        <rect x="634" y="132" width="140" height="58" rx="14" fill="#e2e8f0" />
                        <rect x="330" y="206" width="444" height="94" rx="14" fill="#e2e8f0" />
                      </>
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-16">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                  FAQ
                </p>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
                  Respuestas rápidas antes de registrarte.
                </h2>
                <p className="mt-3 text-slate-600 max-w-2xl">
                  Transparencia para generar confianza y reducir dudas en el punto de decisión.
                </p>
              </div>
              <Button
                className={["rounded-full px-7 text-white", ctaClasses].join(" ")}
                onClick={() => {
                  track("cta_faq_to_register");
                  scrollToRegister();
                }}
              >
                {copy.primaryCta}
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                {[
                  {
                    q: "¿Qué necesito para empezar?",
                    a: "Solo tu email. El registro completo ocurre dentro del flujo (talento o empresa) para evitar fricción en el landing.",
                  },
                  {
                    q: "¿Esto reemplaza mi CV o mi ATS?",
                    a: "No necesariamente. FirstStep está pensado para ayudarte a preparar, organizar y dar seguimiento; puedes exportar y usarlo junto a tus herramientas actuales.",
                  },
                  {
                    q: "¿Qué significa “early access”?",
                    a: "Acceso limitado para validar el producto con usuarios reales, iterar rápido y ofrecer beneficios iniciales.",
                  },
                  {
                    q: "¿Cómo manejan la seguridad?",
                    a: "El backend aplica hashing de contraseñas (bcrypt), tokens JWT y validaciones de entrada. En producción, el tráfico debe viajar bajo HTTPS.",
                  },
                  {
                    q: "¿Puedo usarlo sin Ollama/IA?",
                    a: "Sí. La asistencia con IA es opcional. Si Ollama no está disponible, las funciones principales siguen siendo usables.",
                  },
                ].map((item) => (
                  <details key={item.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
                    <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                      <span className="font-semibold text-[#0f172a]">{item.q}</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">
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
                          aria-hidden="true"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>

              <div className="lg:col-span-5 rounded-[2rem] border border-slate-200 bg-slate-50/40 p-7">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
                  Confianza
                </p>
                <h3 className="mt-3 text-xl font-bold text-[#0f172a]">Señales de credibilidad</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  Diseñado para generar confianza desde el primer clic: claridad, control y una experiencia sin sorpresas.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  {[
                    { t: "Privacidad", d: "Solo pedimos lo imprescindible para empezar." },
                    { t: "Transparencia", d: "Sabrás qué sigue y por qué importa." },
                    { t: "Control", d: "Eliges tu tipo de cuenta y tu camino." },
                    { t: "Confianza", d: "Mensajes claros y foco en resultados." },
                  ].map((b) => (
                    <div key={b.t} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="font-semibold text-slate-900">{b.t}</p>
                      <p className="mt-1 text-xs text-slate-500">{b.d}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="registro"
          ref={(el) => {
            registerSectionRef.current = el;
          }}
          className="max-w-6xl mx-auto px-4 py-16"
        >
          <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-8 py-7 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                  Registro
                </p>
                <h2 className="mt-2 text-3xl md:text-4xl font-bold text-[#0f172a] tracking-tight">
                  Empieza ahora con lo mínimo.
                </h2>
                <p className="mt-3 text-slate-600 max-w-2xl">
                  El formulario embebido solo pide lo imprescindible para reducir fricción.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="rounded-full bg-slate-100 border border-slate-200 px-4 py-2 tabular-nums">
                  Quedan {remainingSpots}/{earlyAccess.limit}
                </span>
              </div>
            </div>

            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-7">
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmitAttempted(true);
                    track("lead_submit_embedded", { role: leadRole });
                    if (!leadEmailOk) return;
                    bumpLocalSignupCount();
                    goToFullSignUp(leadRole, leadEmail.trim());
                  }}
                >
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="tu@correo.com"
                      value={leadEmail}
                      onChange={(e) => setLeadEmail(e.target.value)}
                      aria-invalid={(submitAttempted && !leadEmailOk) || undefined}
                      className={[
                        "bg-[#f3f5f8] rounded-xl placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                        submitAttempted && !leadEmailOk ? "ring-2 ring-red-200" : null,
                      ].join(" ")}
                    />
                    {submitAttempted && !leadEmailOk ? (
                      <p className="mt-2 text-[11px] text-red-700">Ingresa un correo válido.</p>
                    ) : null}
                  </div>

                  <div
                    className="relative grid grid-cols-2 rounded-full bg-slate-100 border border-slate-200 p-1"
                    role="tablist"
                    aria-label="Tipo de cuenta"
                  >
                    <div
                      aria-hidden="true"
                      className={[
                        "pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-slate-900 shadow-sm transition-transform duration-300 ease-out",
                        leadRole === "empresa" ? "translate-x-full" : "translate-x-0",
                      ].join(" ")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className={[
                        "relative z-10 rounded-full justify-center bg-transparent hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
                        leadRole === "talento" ? "text-white" : "text-slate-700 hover:bg-white/60",
                      ].join(" ")}
                      onClick={() => {
                        track("lead_role_select", { role: "talento" });
                        setLeadRole("talento");
                      }}
                      role="tab"
                      aria-selected={leadRole === "talento"}
                    >
                      Promesas
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className={[
                        "relative z-10 rounded-full justify-center bg-transparent hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20",
                        leadRole === "empresa" ? "text-white" : "text-slate-700 hover:bg-white/60",
                      ].join(" ")}
                      onClick={() => {
                        track("lead_role_select", { role: "empresa" });
                        setLeadRole("empresa");
                      }}
                      role="tab"
                      aria-selected={leadRole === "empresa"}
                    >
                      Empresa
                    </Button>
                  </div>

                  <Button type="submit" className={["w-full rounded-full py-4 text-white", ctaClasses].join(" ")}>
                    {copy.primaryCta}
                  </Button>

                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Al continuar, se abre el registro completo. No enviamos correos sin que completes tu cuenta.
                  </p>
                </form>
              </div>

              <div className="lg:col-span-5 rounded-[2rem] border border-slate-200 bg-slate-50/40 p-7">
                <p className="text-xs font-bold tracking-widest uppercase text-slate-400">
                  Beneficios early access
                </p>
                <h3 className="mt-3 text-xl font-bold text-[#0f172a]">Lo mejor, primero</h3>
                <ul className="mt-5 space-y-3 text-sm text-slate-600">
                  {[
                    "Acceso priorizado a nuevas funcionalidades.",
                    "Feedback directo para influir en la hoja de ruta.",
                    "Plantillas y flujos listos para usar.",
                  ].map((b) => (
                    <li key={b} className="flex items-start gap-3">
                      <span className="mt-1 w-5 h-5 rounded-full bg-sky-500/10 text-sky-700 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      <span className="leading-relaxed">{b}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-semibold text-slate-900">Cuenta regresiva</p>
                  <p className="mt-2 text-sm text-slate-600 tabular-nums">
                    {String(countdown.days).padStart(2, "0")} días, {String(countdown.hours).padStart(2, "0")}h{" "}
                    {String(countdown.mins).padStart(2, "0")}m {String(countdown.secs).padStart(2, "0")}s
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    El acceso se prioriza mientras haya cupos y dentro del periodo de early access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <span className="font-bold text-[#1e3456] text-lg tracking-tight block mb-1">FirstStep</span>
            <p className="text-[11px] text-slate-400">© 2026 FirsTep. Todos los derechos reservados.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
            <a href="#funcionalidades" className="hover:text-[#1e3456] transition-colors">
              Funcionalidades
            </a>
            <a href="#casos" className="hover:text-[#1e3456] transition-colors">
              Casos de uso
            </a>
            <Link to={routes.portal} className="hover:text-[#1e3456] transition-colors">
              Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
