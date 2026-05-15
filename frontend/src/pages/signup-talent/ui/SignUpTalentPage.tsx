import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useTalentSignUp } from "@/features/auth/signup-talent/model/useTalentSignUp";
import { routes } from "@/shared/config/routes";
import { Button, Checkbox, Input, PasswordField } from "@/shared/ui";

export function SignUpTalentPage() {
  const signUp = useTalentSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return email.trim().length === 0 || password.trim().length < 8 || !acceptedTerms;
  }, [acceptedTerms, email, password]);

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-800 flex items-center justify-center p-4 md:p-8">
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

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                signUp({ email });
              }}
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Correo
                </label>
                <Input
                  type="email"
                  placeholder="alex@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Contraseña
                </label>
                <PasswordField
                  value={password}
                  onChange={setPassword}
                  placeholder="Mín. 8 caracteres"
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#1e3456]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                <span className="text-xs text-slate-500 leading-tight">
                  Acepto los{" "}
                  <a href="#" className="text-[#1e3456] font-medium hover:underline">
                    Términos
                  </a>{" "}
                  y la{" "}
                  <a href="#" className="text-[#1e3456] font-medium hover:underline">
                    Política de Privacidad
                  </a>
                  .
                </span>
              </div>

              <Button type="submit" disabled={isSubmitDisabled} className="w-full rounded-xl py-3.5">
                Crear cuenta
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
