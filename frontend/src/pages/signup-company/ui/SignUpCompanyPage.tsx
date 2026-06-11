// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     SignUpCompanyPage.tsx                                   ║
// ║ Módulo:      frontend/src/pages/signup-company/ui                    ║
// ║ Descripción: Registro de empresa (mock) con datos de organización.   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { useCompanySignUp } from "@/features/auth/login-company/model/useCompanySignUp";
import { routes } from "@/shared/config/routes";
import { Button, Checkbox, Input, PasswordField, Select } from "@/shared/ui";

const COMPANY_SIZES = [
  { value: "1-10", label: "1 - 10 empleados" },
  { value: "11-50", label: "11 - 50 empleados" },
  { value: "51-200", label: "51 - 200 empleados" },
  { value: "201-500", label: "201 - 500 empleados" },
  { value: "500+", label: "500+ empleados" },
];

function normalizeSupabaseUrl(raw: string) {
  const v = raw.trim();
  if (!v) return "";
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}`;
  } catch {
    return v.replace(/\/rest\/v1(\/.*)?$/i, "").replace(/\/+$/g, "");
  }
}

function readEmailFromJwt(token: string) {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as { email?: unknown };
    return typeof parsed.email === "string" ? parsed.email : null;
  } catch {
    return null;
  }
}

/**
 * Renderiza el formulario de registro para empresas.
 * En el mock actual, crea una sesión local de empresa y redirige al dashboard.
 */
export function SignUpCompanyPage() {
  const session = useSession();
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useCompanySignUp();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("email") ?? "";
  });
  const [companySize, setCompanySize] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [legalOpen, setLegalOpen] = useState<null | "terms" | "privacy">(null);

  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthConfigOpen, setOauthConfigOpen] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState(() => {
    const env = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (env) return env;
    if (typeof window === "undefined") return "";
    return localStorage.getItem("firststep.supabase.url") ?? "";
  });
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(() => {
    const env = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    if (env) return env;
    if (typeof window === "undefined") return "";
    return localStorage.getItem("firststep.supabase.anonKey") ?? "";
  });
  const normalizedSupabaseUrl = useMemo(() => normalizeSupabaseUrl(supabaseUrl), [supabaseUrl]);
  const supabaseConfigured = Boolean(normalizedSupabaseUrl && supabaseAnonKey.trim());

  const emailOk = useMemo(() => {
    const v = email.trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, [email]);

  const companyNameOk = useMemo(() => {
    const v = companyName.trim();
    return v.length >= 2;
  }, [companyName]);

  const passwordRules = useMemo(() => {
    return {
      len: password.length >= 8,
      lower: /[a-z]/.test(password),
      upper: /[A-Z]/.test(password),
      number: /\d/.test(password),
    };
  }, [password]);

  const passwordOk = passwordRules.len && passwordRules.lower && passwordRules.upper && passwordRules.number;
  const confirmOk = confirmPassword.length > 0 && confirmPassword === password;

  const companyNameError = useMemo(() => {
    if (!submitAttempted && companyName.trim().length === 0) return null;
    if (!companyNameOk) return "Ingresa el nombre de la empresa.";
    return null;
  }, [companyName, companyNameOk, submitAttempted]);

  const emailError = useMemo(() => {
    if (!submitAttempted && email.trim().length === 0) return null;
    if (!emailOk) return "Ingresa un correo válido.";
    return null;
  }, [email, emailOk, submitAttempted]);

  const companySizeError = useMemo(() => {
    if (!submitAttempted && companySize.trim().length === 0) return null;
    if (!companySize.trim()) return "Selecciona el tamaño de la empresa.";
    return null;
  }, [companySize, submitAttempted]);

  const passwordError = useMemo(() => {
    if (!submitAttempted && password.length === 0) return null;
    if (!passwordOk) return "Tu contraseña debe cumplir los requisitos.";
    return null;
  }, [password.length, passwordOk, submitAttempted]);

  const confirmError = useMemo(() => {
    if (!submitAttempted && confirmPassword.length === 0) return null;
    if (!confirmOk) return "Las contraseñas no coinciden.";
    return null;
  }, [confirmOk, confirmPassword.length, submitAttempted]);

  const termsError = useMemo(() => {
    if (!submitAttempted) return null;
    if (!acceptedTerms) return "Debes aceptar los Términos y la Política para continuar.";
    return null;
  }, [acceptedTerms, submitAttempted]);

  const isSubmitDisabled = useMemo(() => {
    const valid = companyNameOk && emailOk && companySize.trim().length > 0 && passwordOk && confirmOk && acceptedTerms;
    return !valid || isLoading;
  }, [acceptedTerms, companyNameOk, companySize, confirmOk, emailOk, isLoading, passwordOk]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const searchErrorRaw = url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? null;
    const searchErrorCode = url.searchParams.get("error_code");
    const searchError = searchErrorRaw ? decodeURIComponent(searchErrorRaw) : null;

    const hashParams = new URLSearchParams(window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "");
    const hashAccessToken = hashParams.get("access_token");
    const hashErrorRaw = hashParams.get("error_description") ?? hashParams.get("error") ?? null;
    const hashError = hashErrorRaw ? decodeURIComponent(hashErrorRaw) : null;

    const urlError = searchError ?? hashError;
    if (!code && !hashAccessToken && !urlError) return;

    let alive = true;

    (async () => {
      setOauthLoading(true);
      setOauthError(null);
      try {
        if (!normalizedSupabaseUrl || !supabaseAnonKey.trim()) {
          throw new Error("OAuth no está configurado (Supabase URL / Anon Key).");
        }

        if (urlError) {
          if (searchErrorCode === "bad_oauth_state") {
            throw new Error(
              "OAuth state no encontrado o expiró. Vuelve a intentarlo sin recargar la página y usando la misma URL (por ejemplo, siempre http://localhost:5173).",
            );
          }
          throw new Error(urlError);
        }

        const supabase = createClient(normalizedSupabaseUrl, supabaseAnonKey.trim());
        let supabaseAccessToken: string | null = null;
        let userEmail: string | null = null;
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          const { data } = await supabase.auth.getSession();
          const sbSession = data.session;
          supabaseAccessToken = sbSession?.access_token ?? null;
          userEmail = sbSession?.user?.email ?? null;
        } else if (hashAccessToken) {
          supabaseAccessToken = hashAccessToken;
          userEmail = readEmailFromJwt(hashAccessToken);
          if (!userEmail) throw new Error("[oauth:decode-token-email] No se pudo leer el email desde el token OAuth.");
        } else {
          throw new Error("Respuesta OAuth incompleta.");
        }
        if (!supabaseAccessToken || !userEmail) throw new Error("No se pudo obtener el access token o email de Supabase.");

        const res = await fetch("/api/auth/login/oauth", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: "empresa" }),
        });

        if (!res.ok) {
          let message = `Login OAuth falló (${res.status}).`;
          try {
            const data = (await res.json()) as any;
            if (typeof data?.error?.message === "string" && data.error.message) {
              message = data.error.message;
            }
          } catch { }
          throw new Error(message);
        }

        const out = (await res.json()) as { accessToken?: string; onboardingCompleted?: boolean };
        const backendToken = out.accessToken ?? "";
        if (!backendToken) throw new Error("El backend no devolvió accessToken.");
        localStorage.setItem("firststep.api.accessToken", backendToken);

        const updateBody: Record<string, string> = {};
        if (companyName.trim()) updateBody.companyName = companyName.trim();
        if (companySize.trim()) updateBody.companySize = companySize.trim();
        if (Object.keys(updateBody).length) {
          await fetch("/api/company/profile", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${backendToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updateBody),
          }).catch(() => null);
        }

        const profRes = await fetch("/api/company/profile", {
          headers: { Authorization: `Bearer ${backendToken}` },
        });
        const profOut = profRes.ok ? ((await profRes.json()) as any) : null;
        const companyNameFromProfile =
          (typeof profOut?.profile?.companyName === "string" && profOut.profile.companyName.trim()) ||
          companyName.trim() ||
          userEmail.split("@")[0];
        const onboardingCompleted = profOut?.onboardingCompleted === true || out.onboardingCompleted === true;

        if (!alive) return;
        session.loginCompany({ companyName: companyNameFromProfile, email: userEmail, onboardingCompleted });
        navigate(onboardingCompleted ? routes.companyDashboard : routes.companyOnboarding);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : String(e);
        setOauthError(msg);
      } finally {
        if (alive) {
          setOauthLoading(false);
          window.history.replaceState({}, document.title, routes.companySignUp);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [companyName, companySize, navigate, normalizedSupabaseUrl, session, supabaseAnonKey]);

  const startGoogleOAuth = async () => {
    setOauthError(null);
    setSubmitAttempted(true);
    if (!acceptedTerms) {
      setOauthError("Debes aceptar los Términos y la Política para continuar.");
      return;
    }
    if (!supabaseConfigured) {
      setOauthConfigOpen(true);
      return;
    }
    try {
      setOauthLoading(true);
      localStorage.setItem("firststep.oauth.returnTo", routes.companySignUp);
      const supabase = createClient(normalizedSupabaseUrl, supabaseAnonKey.trim());
      const redirectTo = `${window.location.origin}${routes.companySignUp}`;
      const { error: oauthStartError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (oauthStartError) throw oauthStartError;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOauthError(msg);
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_28%,#f8fafc_100%)] text-slate-800 flex items-center justify-center p-4 md:p-8">
      {oauthConfigOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/40" onClick={() => setOauthConfigOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">Configurar OAuth (Supabase)</p>
              <button
                type="button"
                onClick={() => setOauthConfigOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Supabase URL
                </label>
                <Input
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxxxx.supabase.co"
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Supabase Publishable Key
                </label>
                <Input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>
              <div className="text-[12px] text-slate-500 leading-relaxed">
                Configura en Supabase el redirect URL
                <span className="font-mono"> {`${window.location.origin}${routes.companySignUp}`}</span>.
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setOauthConfigOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const url = normalizeSupabaseUrl(supabaseUrl);
                  const key = supabaseAnonKey.trim();
                  localStorage.setItem("firststep.supabase.url", url);
                  localStorage.setItem("firststep.supabase.anonKey", key);
                  setSupabaseUrl(url);
                  setSupabaseAnonKey(key);
                  setOauthConfigOpen(false);
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      {legalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-950/40" onClick={() => setLegalOpen(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <p className="text-sm font-bold text-[#111827]">
                {legalOpen === "terms" ? "Términos de Servicio" : "Política de Privacidad"}
              </p>
              <button
                type="button"
                onClick={() => setLegalOpen(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-slate-600 leading-relaxed">
              {legalOpen === "terms" ? (
                <div className="space-y-3">
                  <p>Al crear una cuenta aceptas usar la plataforma de forma responsable y conforme a la ley.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>No publiques información falsa o engañosa.</li>
                    <li>Mantén tus credenciales seguras.</li>
                    <li>Podemos suspender cuentas por abuso o uso indebido.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <p>Usamos tus datos para crear tu cuenta, mejorar tu experiencia y permitirte acceder a funcionalidades.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Guardamos tu email para autenticación.</li>
                    <li>Puedes solicitar eliminación de tu cuenta.</li>
                    <li>No compartimos tu información sensible sin tu consentimiento.</li>
                  </ul>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setLegalOpen(null)}>
                Entendido
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="w-full max-w-[1100px] bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-5 bg-[#1e3456] text-white p-10 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#5d85c4]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

          <div className="relative">
            <p className="text-[11px] font-bold tracking-widest uppercase text-blue-100/80">
              Empresas
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Crea tu cuenta
            </h1>
            <p className="mt-4 text-blue-100/80 leading-relaxed">
              Registra tu empresa y empieza a gestionar tu proceso de selección con un flujo claro y rápido.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4">
              {[
                {
                  title: "Publica y atrae mejor",
                  desc: "Crea vacantes con una propuesta clara y coherente con tu marca empleadora.",
                },
                {
                  title: "Centraliza tu proceso",
                  desc: "Un solo lugar para organizar candidatos, conversaciones y próximos pasos.",
                },
                {
                  title: "Decide con más claridad",
                  desc: "Menos ruido, más contexto: prioriza lo importante y acelera decisiones.",
                },
              ].map((b) => (
                <div key={b.title} className="rounded-2xl bg-white/5 border border-white/10 p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
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
                        className="text-white/85"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{b.title}</p>
                      <p className="mt-1 text-xs text-blue-100/80 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {["Startups", "Pymes", "Equipos de RRHH", "Founder-led hiring"].map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-semibold tracking-widest uppercase rounded-full bg-white/10 border border-white/15 px-3 py-1 text-blue-100/90"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-6">
              <p className="text-xs text-blue-100/80">
                ¿Ya tienes cuenta?{" "}
                <Link to={routes.companyLogin} className="text-white font-semibold hover:underline">
                  Inicia sesión
                </Link>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Link to={routes.login} className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full border-white/30 text-white hover:bg-white/10"
                  >
                    Login talento
                  </Button>
                </Link>
                <Link to={routes.talentSignUp} className="w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full border-white/30 text-white hover:bg-white/10"
                  >
                    Registro talento
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 p-10 md:p-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase text-slate-500">
                  Registro empresa
                </div>
                <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">
                  Crea tu cuenta
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Configura lo básico para empezar a publicar y gestionar tus vacantes.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-[11px] text-slate-600">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1e3456] text-white text-[11px] font-bold">
                  1
                </span>
                <span>Datos</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>¿Eres talento?</span>
              <div className="flex items-center gap-3">
                <Link to={routes.talentSignUp} className="font-semibold text-[#1e3456] hover:underline">
                  Registro talento
                </Link>
                <span className="text-slate-300">/</span>
                <Link to={routes.login} className="font-semibold text-[#1e3456] hover:underline">
                  Login talento
                </Link>
              </div>
            </div>

            {oauthError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {oauthError}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                Registro rápido
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-slate-500 border border-slate-200 bg-white transition-colors text-sm disabled:opacity-60 disabled:pointer-events-none"
                  disabled
                >
                  <svg className="w-4 h-4" fill="#0077b5" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  LinkedIn (pronto)
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm disabled:opacity-60 disabled:pointer-events-none"
                  disabled={oauthLoading || isLoading}
                  onClick={startGoogleOAuth}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {oauthLoading ? "Conectando..." : "Google"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 my-7">
              <div className="h-px bg-slate-100 flex-1" />
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
                o con correo
              </span>
              <div className="h-px bg-slate-100 flex-1" />
            </div>

            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitAttempted(true);
                clearError();
                if (!companyNameOk || !emailOk || !companySize.trim() || !passwordOk || !confirmOk || !acceptedTerms) return;
                await signUp({
                  companyName: companyName.trim(),
                  companySize,
                  email: email.trim(),
                  password,
                  acceptedTerms: true,
                  acceptedPrivacy: true,
                });
              }}
            >
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Nombre de la Empresa
              </label>
              <Input
                type="text"
                placeholder="ej. Acme Tech"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                aria-invalid={Boolean(companyNameError) || undefined}
                className={[
                  "bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                  companyNameError ? "ring-2 ring-red-200" : null,
                ].join(" ")}
                disabled={isLoading}
              />
              {companyNameError ? <p className="mt-2 text-[11px] text-red-700">{companyNameError}</p> : null}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Correo de Trabajo
              </label>
              <Input
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={Boolean(emailError) || undefined}
                className={[
                  "bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                  emailError ? "ring-2 ring-red-200" : null,
                ].join(" ")}
                disabled={isLoading}
              />
              {emailError ? <p className="mt-2 text-[11px] text-red-700">{emailError}</p> : null}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Tamaño de la Empresa
              </label>
              <div className="relative">
                <Select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className={[
                    "appearance-none pr-10 bg-[#f3f5f8] rounded-xl",
                    companySizeError ? "ring-2 ring-red-200" : null,
                  ].join(" ")}
                  disabled={isLoading}
                >
                  <option value="" disabled>
                    Selecciona el tamaño
                  </option>
                  {COMPANY_SIZES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                <div className="pointer-events-none absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400">
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
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>
              {companySizeError ? <p className="mt-2 text-[11px] text-red-700">{companySizeError}</p> : null}
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Contraseña
              </label>
              <PasswordField
                value={password}
                onChange={(v) => setPassword(v)}
                placeholder="Mín. 8 caracteres"
                className={[
                  "bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                  passwordError ? "ring-2 ring-red-200" : null,
                ].join(" ")}
                disabled={isLoading}
              />
              {passwordError ? <p className="mt-2 text-[11px] text-red-700">{passwordError}</p> : null}
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div className={passwordRules.len ? "text-emerald-700" : ""}>• 8+ caracteres</div>
                <div className={passwordRules.upper ? "text-emerald-700" : ""}>• 1 mayúscula</div>
                <div className={passwordRules.lower ? "text-emerald-700" : ""}>• 1 minúscula</div>
                <div className={passwordRules.number ? "text-emerald-700" : ""}>• 1 número</div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                Confirmar Contraseña
              </label>
              <PasswordField
                value={confirmPassword}
                onChange={(v) => setConfirmPassword(v)}
                placeholder="Repite tu contraseña"
                className={[
                  "bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                  confirmError ? "ring-2 ring-red-200" : null,
                ].join(" ")}
                disabled={isLoading}
              />
              {confirmError ? <p className="mt-2 text-[11px] text-red-700">{confirmError}</p> : null}
            </div>

            <div className="flex items-start gap-2 pt-2 pb-2">
              <Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} disabled={isLoading} />
              <span className="text-xs text-slate-500 leading-tight">
                Acepto los{" "}
                <button type="button" className="text-[#1e3456] font-medium hover:underline" onClick={() => setLegalOpen("terms")}>
                  Términos de Servicio
                </button>{" "}
                y la{" "}
                <button type="button" className="text-[#1e3456] font-medium hover:underline" onClick={() => setLegalOpen("privacy")}>
                  Política de Privacidad
                </button>
                .
              </span>
            </div>
            {termsError ? <p className="mt-1 text-[11px] text-red-700">{termsError}</p> : null}

            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full rounded-xl py-3.5"
            >
              {isLoading ? "Creando..." : "Crear Cuenta de Empresa"}
            </Button>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Tu contraseña se guarda de forma segura y podrás completar el perfil de tu empresa después.
            </p>
          </form>

          <p className="text-center text-xs text-slate-500 mt-8">
            ¿Ya tienes una cuenta de empresa?{" "}
            <Link to={routes.companyLogin} className="text-[#1e3456] font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>

          <div className="flex justify-center mt-8">
            <a
              href="#"
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              Centro de Ayuda
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
