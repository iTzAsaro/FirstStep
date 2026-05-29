// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     SignUpTalentPage.tsx                                    ║
// ║ Módulo:      frontend/src/pages/signup-talent/ui                     ║
// ║ Descripción: Registro de talento (mock) con validaciones básicas.    ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useTalentSignUp } from "@/features/auth/signup-talent/model/useTalentSignUp";
import { routes } from "@/shared/config/routes";
import { Button, Checkbox, Input, PasswordField } from "@/shared/ui";

/**
 * Renderiza el formulario de registro para talento.
 * En el mock actual, crea una sesión local y redirige a onboarding.
 */
export function SignUpTalentPage() {
  const { signUp, isLoading, error, clearError } = useTalentSignUp();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [legalOpen, setLegalOpen] = useState<null | "terms" | "privacy">(null);

  const emailOk = useMemo(() => {
    const v = email.trim();
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }, [email]);

  const fullNameOk = useMemo(() => {
    const v = fullName.trim();
    if (v.length < 3) return false;
    return /[a-zA-ZÀ-ÿ]/.test(v);
  }, [fullName]);

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

  const fullNameError = useMemo(() => {
    if (!submitAttempted && fullName.trim().length === 0) return null;
    if (!fullNameOk) return "Ingresa tu nombre completo.";
    return null;
  }, [fullName, fullNameOk, submitAttempted]);

  const emailError = useMemo(() => {
    if (!submitAttempted && email.trim().length === 0) return null;
    if (!emailOk) return "Ingresa un correo válido.";
    return null;
  }, [email, emailOk, submitAttempted]);

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
    const valid = fullNameOk && emailOk && passwordOk && confirmOk && acceptedTerms;
    return !valid || isLoading;
  }, [acceptedTerms, confirmOk, emailOk, fullNameOk, isLoading, passwordOk]);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800 flex items-center justify-center p-4 md:p-8">
      {legalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setLegalOpen(null)}
          />
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
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-slate-600 leading-relaxed">
              {legalOpen === "terms" ? (
                <div className="space-y-3">
                  <p>
                    Al crear una cuenta aceptas usar la plataforma de forma responsable y conforme a la ley.
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>No publiques información falsa o engañosa.</li>
                    <li>Mantén tus credenciales seguras.</li>
                    <li>Podemos suspender cuentas por abuso o uso indebido.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <p>
                    Usamos tus datos para crear tu cuenta, mejorar tu experiencia y permitirte acceder a las
                    funcionalidades del producto.
                  </p>
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
              Talento
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
              Crea tu perfil
            </h1>
            <p className="mt-4 text-blue-100/80 leading-relaxed">
              Regístrate y completa tu onboarding para acceder al dashboard.
            </p>

            <div className="mt-10 rounded-2xl bg-white/5 border border-white/10 p-6">
              <p className="text-xs text-blue-100/80">
                ¿Ya tienes cuenta?{" "}
                <Link to={routes.login} className="text-white font-semibold hover:underline">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 p-10 md:p-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#111827]">
              Registro
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Crea tu cuenta para empezar.
            </p>

            {error ? (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form
              className="mt-8 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitAttempted(true);
                clearError();
                if (!fullNameOk || !emailOk || !passwordOk || !confirmOk || !acceptedTerms) return;
                await signUp({
                  email,
                  password,
                  fullName: fullName.trim(),
                  acceptedTerms: true,
                  acceptedPrivacy: true,
                });
              }}
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Nombre completo
                </label>
                <Input
                  type="text"
                  placeholder="Ej: Carlos Ruiz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  aria-invalid={Boolean(fullNameError) || undefined}
                  className={[
                    "bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                    fullNameError ? "ring-2 ring-red-200" : null,
                  ].join(" ")}
                  disabled={isLoading}
                />
                {fullNameError ? <p className="mt-2 text-[11px] text-red-700">{fullNameError}</p> : null}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Correo
                </label>
                <Input
                  type="email"
                  placeholder="alex@ejemplo.com"
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
                  Contraseña
                </label>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="Mín. 8 caracteres"
                  className={[
                    "bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                    passwordError ? "ring-2 ring-red-200" : null,
                  ].join(" ")}
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { ok: passwordRules.len, label: "8+ caracteres" },
                    { ok: passwordRules.upper, label: "1 mayúscula" },
                    { ok: passwordRules.lower, label: "1 minúscula" },
                    { ok: passwordRules.number, label: "1 número" },
                  ].map((r) => (
                    <div
                      key={r.label}
                      className={[
                        "flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] border",
                        r.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-600",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "w-4 h-4 rounded-full flex items-center justify-center",
                          r.ok ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500",
                        ].join(" ")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      <span className="font-semibold">{r.label}</span>
                    </div>
                  ))}
                </div>
                {passwordError ? <p className="mt-2 text-[11px] text-red-700">{passwordError}</p> : null}
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Confirmar contraseña
                </label>
                <PasswordField
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  className={[
                    "bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent",
                    confirmError ? "ring-2 ring-red-200" : null,
                  ].join(" ")}
                />
                {confirmError ? <p className="mt-2 text-[11px] text-red-700">{confirmError}</p> : null}
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                <span className="text-xs text-slate-500 leading-tight">
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={() => setLegalOpen("terms")}
                    className="text-[#1e3456] font-medium hover:underline"
                  >
                    Términos
                  </button>{" "}
                  y la{" "}
                  <button
                    type="button"
                    onClick={() => setLegalOpen("privacy")}
                    className="text-[#1e3456] font-medium hover:underline"
                  >
                    Política de Privacidad
                  </button>
                  .
                </span>
              </div>
              {termsError ? <p className="text-[11px] text-red-700">{termsError}</p> : null}

              <Button type="submit" disabled={isSubmitDisabled} className="w-full rounded-xl py-3.5">
                {isLoading ? "Creando cuenta…" : "Crear cuenta"}
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
