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
    const v = raw.trim();
    if (!v) return "";
    try {
      const u = new URL(v);
      return `${u.protocol}//${u.host}`;
    } catch {
      return v.replace(/\/rest\/v1(\/.*)?$/i, "").replace(/\/+$/g, "");
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
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const searchErrorRaw = url.searchParams.get("error_description") ?? url.searchParams.get("error") ?? null;
    const searchErrorCode = url.searchParams.get("error_code");
    const searchError = searchErrorRaw ? decodeURIComponent(searchErrorRaw) : null;

    const hashParams = new URLSearchParams(window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "");
    const hashAccessToken = hashParams.get("access_token");
    const hashRefreshToken = hashParams.get("refresh_token");
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
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (hashAccessToken && hashRefreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });
          if (sessionError) throw sessionError;
        } else {
          throw new Error("Respuesta OAuth incompleta.");
        }

        const { data } = await supabase.auth.getSession();
        const session = data.session;
        const accessToken = session?.access_token;
        const userEmail = session?.user?.email ?? null;

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
    <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-4 md:p-8">
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
                  Supabase Anon Key
                </label>
                <Input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#0b1220]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
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
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-[2rem] bg-white/5 border border-white/10 p-10 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#5d85c4]/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

          <div className="relative">
            <p className="text-[11px] font-bold tracking-widest uppercase text-white/70">
              Portal de Empresas
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Inicia sesión como empresa
            </h1>
            <p className="mt-4 text-white/70 leading-relaxed max-w-md">
              Accede a tu panel para gestionar procesos, vacantes y seguimiento de talento.
            </p>

            <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-6">
              <p className="text-xs text-white/70">
                ¿Aún no tienes cuenta?{" "}
                <Link to={routes.companySignUp} className="text-white font-semibold hover:underline">
                  Registra tu empresa
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-[2rem] bg-white p-10 md:p-12 text-slate-900">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">
              Acceso corporativo
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Ingresa con los datos de tu organización.
            </p>

            <div className="mt-6">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3 font-medium text-slate-700 hover:bg-slate-50 transition-colors text-sm"
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
                Continuar con Google
              </button>
            </div>

            {oauthError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {oauthError}
              </div>
            ) : null}

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form
              className="mt-8 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setOauthError(null);
                clearError();
                await loginWithPassword({ email: email.trim(), password });
              }}
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Correo
                </label>
                <Input
                  type="email"
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#0b1220]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Contraseña
                </label>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#0b1220]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
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
