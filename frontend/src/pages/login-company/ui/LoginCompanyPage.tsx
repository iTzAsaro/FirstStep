import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useCompanyLogin } from "@/features/auth/login-company/model/useCompanyLogin";
import { routes } from "@/shared/config/routes";
import { Button, Input, PasswordField } from "@/shared/ui";

export function LoginCompanyPage() {
  const loginCompany = useCompanyLogin();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSubmitDisabled = useMemo(() => {
    return companyName.trim().length === 0 || email.trim().length === 0 || password.trim().length === 0;
  }, [companyName, email, password]);

  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-4 md:p-8">
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

            <form
              className="mt-8 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                loginCompany({ companyName, email });
              }}
            >
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                  Nombre de la empresa
                </label>
                <Input
                  type="text"
                  placeholder="ej. Acme Tech"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-[#f3f5f8] rounded-xl focus:ring-[#0b1220]/20 placeholder:text-slate-400 text-sm border border-transparent focus:border-transparent"
                />
              </div>

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
                Iniciar sesión
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
