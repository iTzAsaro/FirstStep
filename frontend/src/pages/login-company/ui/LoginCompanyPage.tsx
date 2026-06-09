// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     LoginCompanyPage.tsx                                    ║
// ║ Módulo:      frontend/src/pages/login-company/ui                     ║
// ║ Descripción: Pantalla de inicio de sesión para empresas (mock).      ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useCompanyLogin } from "@/features/auth/login-company/model/useCompanyLogin";
import { routes } from "@/shared/config/routes";
import { Button, Input, PasswordField } from "@/shared/ui";

/**
 * Renderiza el formulario de login para empresas.
 * En el mock actual, el login persiste sesión local y redirige al dashboard.
 */
export function LoginCompanyPage() {
  const { loginWithPassword, loginWithEmail, isLoading, error, clearError } = useCompanyLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oauthError, setOauthError] = useState<string | null>(null);

  const normalizeSupabaseUrl = (raw: string) => {
    const v = raw.trim().replace("xkhlhawelqtmxcoqznup.supabase.co", "xhklhawelqtmxcoqznup.supabase.co");
    if (!v) return "";
    try {
      const u = new URL(v);
      return `${u.protocol}//${u.host}`;
    } catch {
      return v.replace(/\/rest\/v1(\/.*)?$/i, "").replace(/\/+$/g, "");
    }
  };
  const readEmailFromJwt = (token: string) => {
    try {
      const [, payload] = token.split(".");
      if (!payload) return null;
      const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      const parsed = JSON.parse(json) as { email?: unknown };
      return typeof parsed.email === "string" ? parsed.email : null;
    } catch {
      return null;
    }
  };

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!normalizedSupabaseUrl || normalizedSupabaseUrl === supabaseUrl) return;
    setSupabaseUrl(normalizedSupabaseUrl);
    localStorage.setItem("firststep.supabase.url", normalizedSupabaseUrl);
  }, [normalizedSupabaseUrl, supabaseUrl]);

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
        let accessToken: string | null = null;
        let userEmail: string | null = null;
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw new Error(`[oauth:exchange-code] ${exchangeError.message}`);
          const { data, error: sessionReadError } = await supabase.auth.getSession();
          if (sessionReadError) throw new Error(`[oauth:get-session] ${sessionReadError.message}`);
          const session = data.session;
          accessToken = session?.access_token ?? null;
          userEmail = session?.user?.email ?? null;
        } else if (hashAccessToken) {
          accessToken = hashAccessToken;
          userEmail = readEmailFromJwt(hashAccessToken);
          if (!userEmail) throw new Error("[oauth:decode-token-email] No se pudo leer el email desde el token OAuth.");
        } else {
          throw new Error("Respuesta OAuth incompleta.");
        }

        if (accessToken) {
          const res = await fetch("/api/auth/login/oauth", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: "empresa" }),
          });

          if (!res.ok) {
            let message = `Login OAuth falló (${res.status}).`;
            try {
              const data = (await res.json()) as any;
              if (typeof data?.error?.message === "string" && data.error.message) message = data.error.message;
            } catch { }
            throw new Error(message);
          }

          const out = (await res.json()) as { accessToken?: string; user?: { role?: string } };
          if (out?.user?.role !== "empresa") {
            localStorage.removeItem("firststep.api.accessToken");
            throw new Error("Esta cuenta no es de empresa. Inicia sesión en /login o usa un correo distinto para empresa.");
          }
          if (out.accessToken) localStorage.setItem("firststep.api.accessToken", out.accessToken);
        }

        if (!alive) return;
        if (!userEmail) throw new Error("No se pudo obtener el email del usuario.");
        await loginWithEmail({ email: userEmail });
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : String(e);
        setOauthError(msg);
      } finally {
        if (alive) {
          window.history.replaceState({}, document.title, routes.companyLogin);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [loginWithEmail, normalizedSupabaseUrl, supabaseAnonKey]);

  const isSubmitDisabled = useMemo(() => {
    return email.trim().length === 0 || password.trim().length === 0 || isLoading;
  }, [email, isLoading, password]);

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex items-center justify-center p-4 md:p-8 text-slate-800">
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
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#0b1220]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
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
                <span className="font-mono"> {`${window.location.origin}${routes.companyLogin}`}</span>.
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
      <div className="flex flex-col md:flex-row w-full max-w-[1100px] bg-white rounded-[2rem] overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)]">
        <div className="w-full md:w-[45%] bg-[#5d85c4] p-10 lg:p-14 flex flex-col relative overflow-hidden text-white min-h-[400px] md:min-h-full">
          <div className="relative z-10 flex flex-col h-full">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight mb-6 mt-4">
              Acceso para empresas.
            </h1>
            <p className="text-[#dbe6f5] text-base lg:text-lg leading-relaxed mb-12 max-w-sm">
              Entra a tu cuenta y gestiona tus procesos de selección con una experiencia clara y rápida.
            </p>

            <div className="mt-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <p className="text-xs text-white/80">
                ¿Aún no tienes cuenta?{" "}
                <Link to={routes.companySignUp} className="text-white font-semibold hover:underline">
                  Registra tu empresa
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

          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-[#2d4875]/20 rounded-full blur-3xl" />
        </div>

        <div className="w-full md:w-[55%] p-10 lg:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-bold text-[#1f2c45] mb-2 tracking-tight">
              Inicia sesión
            </h2>
            <p className="text-slate-500 text-sm mb-8">
              Ingresa con los datos de tu empresa para continuar.
            </p>
            <div className="mb-8 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>¿Eres talento?</span>
              <div className="flex items-center gap-3">
                <Link to={routes.login} className="font-semibold text-[#1e3456] hover:underline">
                  Iniciar sesión
                </Link>
                <span className="text-slate-300">/</span>
                <Link to={routes.talentSignUp} className="font-semibold text-[#1e3456] hover:underline">
                  Registrarte
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm disabled:opacity-60 disabled:pointer-events-none"
                disabled={isLoading}
                onClick={async () => {
                  localStorage.setItem("firststep.oauth.returnTo", routes.companyLogin);
                  setOauthError(null);
                  try {
                    if (!supabaseConfigured) {
                      setOauthConfigOpen(true);
                      return;
                    }

                    const supabase = createClient(normalizedSupabaseUrl, supabaseAnonKey.trim());
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: { redirectTo: `${window.location.origin}${routes.companyLogin}` },
                    });
                    if (error) throw error;
                  } catch (e) {
                    const msg = e instanceof Error ? e.message : String(e);
                    setOauthError(msg);
                  }
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm disabled:opacity-60 disabled:pointer-events-none"
                disabled
              >
                <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                LinkedIn
              </button>
            </div>

            {oauthError ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {oauthError}
              </div>
            ) : null}

            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-center gap-4 mb-8">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
                O continúa con correo
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setOauthError(null);
                clearError();
                await loginWithPassword({ email: email.trim(), password });
              }}
            >
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Correo
                </label>
                <Input
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#5d85c4] placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#5d85c4] placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>

              <Button type="submit" disabled={isSubmitDisabled} className="w-full rounded-xl py-3.5">
                {isLoading ? "Ingresando..." : "Iniciar sesión"}
              </Button>
            </form>

            <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
              <Link to={routes.home} className="font-semibold hover:underline">
                Volver al inicio
              </Link>
              <Link to={routes.portal} className="font-semibold hover:underline">
                Ir al portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
