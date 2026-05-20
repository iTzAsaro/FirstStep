// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     SignUpCompanyPage.tsx                                   ║
// ║ Módulo:      frontend/src/pages/signup-company/ui                    ║
// ║ Descripción: Registro de empresa (mock) con datos de organización.   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useMemo, useState } from "react";

import { Link } from "react-router-dom";

import { useCompanySignUp } from "@/features/auth/login-company/model/useCompanySignUp";
import { routes } from "@/shared/config/routes";
import { Button, Checkbox, Input, Select } from "@/shared/ui";

const COMPANY_SIZES = [
  { value: "1-10", label: "1 - 10 empleados" },
  { value: "11-50", label: "11 - 50 empleados" },
  { value: "51-200", label: "51 - 200 empleados" },
  { value: "201-500", label: "201 - 500 empleados" },
  { value: "500+", label: "500+ empleados" },
];

/**
 * Renderiza el formulario de registro para empresas.
 * En el mock actual, crea una sesión local de empresa y redirige al dashboard.
 */
export function SignUpCompanyPage() {
  const signUp = useCompanySignUp();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isSubmitDisabled = useMemo(() => {
    return (
      companyName.trim().length === 0 ||
      email.trim().length === 0 ||
      companySize.trim().length === 0 ||
      password.trim().length < 8 ||
      !acceptedTerms
    );
  }, [acceptedTerms, companyName, companySize, email, password]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      <div className="w-full md:w-1/2 bg-[#1e3456] flex flex-col justify-between p-8 md:p-12 lg:p-16 relative overflow-hidden text-white min-h-[500px] md:min-h-screen">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight">FirsTep</span>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2.5 py-1 rounded-full text-blue-100">
            Para Empresas
          </span>
        </div>

        <div className="relative z-10 my-auto py-12">
          <h1 className="text-4xl md:text-5xl lg:text-[54px] font-bold leading-[1.1] tracking-tight mb-6 max-w-lg">
            Encuentra tu nueva generación de talentos
          </h1>
          <p className="text-blue-100/80 text-base md:text-lg leading-relaxed mb-10 max-w-md">
            Únete a una comunidad de empleadores con visión de futuro que conectan con 12k+ graduados
            listos para trabajar. Optimiza tus contrataciones con IA.
          </p>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[
                "https://i.pravatar.cc/100?img=1",
                "https://i.pravatar.cc/100?img=2",
                "https://i.pravatar.cc/100?img=3",
              ].map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="w-8 h-8 rounded-full border-2 border-[#1e3456] object-cover"
                />
              ))}
            </div>
            <span className="text-xs text-blue-100/70 font-medium">
              Con la confianza de 450+ empresas globales
            </span>
          </div>
        </div>

        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1e3456] via-[#1e3456]/80 to-transparent z-0" />

          <div className="relative z-10 flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg shrink-0 mt-0.5">
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
                className="text-blue-200"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Fondo de Talento Verificado</h3>
              <p className="text-xs text-blue-100/70 leading-relaxed">
                Cada graduado es verificado por sus habilidades y credenciales.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 lg:p-16 bg-white">
        <div className="w-full max-w-[420px]">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0f172a] mb-2 tracking-tight text-center md:text-left">
            Crear Cuenta de Empresa
          </h2>
          <p className="text-slate-500 text-sm mb-8 text-center md:text-left">
            Completa los detalles para comenzar a contratar a tus próximos talentos destacados.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-2.5 font-medium text-slate-600 hover:bg-slate-50 transition-colors text-xs"
            >
              <svg className="w-4 h-4" fill="#0077b5" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-lg py-2.5 font-medium text-slate-600 hover:bg-slate-50 transition-colors text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[9px] font-semibold text-slate-400 tracking-widest uppercase">
              O CON CORREO
            </span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              signUp({ companyName, email });
            }}
          >
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Nombre de la Empresa
              </label>
              <Input
                type="text"
                placeholder="ej. Acme Tech"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="bg-[#f8fafc] rounded-lg focus:ring-[#1e3456]/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Correo de Trabajo
              </label>
              <Input
                type="email"
                placeholder="nombre@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#f8fafc] rounded-lg focus:ring-[#1e3456]/20"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Tamaño de la Empresa
              </label>
              <div className="relative">
                <Select
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="appearance-none pr-10"
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
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="Mín. 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#f8fafc] rounded-lg focus:ring-[#1e3456]/20"
              />
            </div>

            <div className="flex items-start gap-2 pt-2 pb-2">
              <Checkbox checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
              <span className="text-xs text-slate-500 leading-tight">
                Acepto los{" "}
                <a href="#" className="text-[#1e3456] font-medium hover:underline">
                  Términos de Servicio
                </a>{" "}
                y la{" "}
                <a href="#" className="text-[#1e3456] font-medium hover:underline">
                  Política de Privacidad
                </a>
                .
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="w-full bg-[#243f65] hover:bg-[#15263d] shadow-md shadow-[#243f65]/20 rounded-lg py-3 text-sm"
            >
              Crear Cuenta de Empresa
            </Button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-8">
            ¿Ya tienes una cuenta de empresa?{" "}
            <Link to={routes.portal} className="text-[#1e3456] font-semibold hover:underline">
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
  );
}
