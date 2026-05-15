import { useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import { useLoginTalent } from "@/features/auth/login-talent/model/useLoginTalent";
import { routes } from "@/shared/config/routes";
import { Button, Input } from "@/shared/ui";

export function LoginPortalPage() {
  const navigate = useNavigate();
  const loginTalent = useLoginTalent();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSubmitDisabled = useMemo(() => {
    return email.trim().length === 0 || password.trim().length === 0;
  }, [email, password]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#f6f8fb]">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full max-w-[1200px] mx-auto">
        <div className="w-full lg:w-1/2 bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)]">
          <div className="inline-flex items-center justify-center px-4 py-1.5 bg-[#f0f4f8] text-[#3d5a80] text-[11px] font-bold tracking-wider uppercase rounded-full mb-8">
            Talento
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#111827] mb-3 tracking-tight">
            Bienvenido de nuevo
          </h1>
          <p className="text-slate-500 text-sm md:text-base mb-10">
            Encuentra tu próximo paso en la industria tech.
          </p>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              loginTalent({ email });
            }}
          >
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
                Correo Electrónico
              </label>
              <Input
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#f8fafc] border border-slate-100 rounded-xl focus:ring-[#294266] focus:bg-white placeholder:text-slate-400/70"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="text-[10px] font-bold text-[#294266] hover:text-blue-700 uppercase tracking-wider transition-colors"
                >
                  ¿Olvidaste?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#f8fafc] border border-slate-100 rounded-xl focus:ring-[#294266] focus:bg-white placeholder:text-slate-400/70"
              />
            </div>

            <Button type="submit" disabled={isSubmitDisabled} className="w-full py-4">
              Iniciar Sesión como Talento
            </Button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px bg-slate-100 flex-1" />
            <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
              O continúa con
            </span>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            <button
              type="button"
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3.5 font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm"
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
              className="flex items-center justify-center gap-2 border border-slate-200 rounded-xl py-3.5 font-medium text-slate-600 hover:bg-slate-50 transition-colors text-sm"
            >
              <svg className="w-5 h-5" fill="#0077b5" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center text-sm">
            <span className="text-slate-500 mb-2 sm:mb-0">¿No tienes una cuenta?</span>
            <Link to={routes.talentSignUp} className="text-[#294266] font-semibold hover:underline">
              Registro Talento
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-1/2 rounded-[2rem] p-8 md:p-12 relative overflow-hidden flex flex-col justify-between shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] min-h-[600px]">
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/90 via-[#111827]/60 to-[#111827]/90 z-0" />

          <div className="relative z-10 flex flex-col h-full">
            <div>
              <div className="inline-flex items-center justify-center px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/10 text-white text-[11px] font-bold tracking-wider uppercase rounded-full mb-8">
                Empresas
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                Portal de Socios
              </h2>
              <p className="text-slate-300 text-sm md:text-base max-w-sm mb-10">
                Gestiona tu flujo de talento y equipos de alto rendimiento.
              </p>
            </div>

            <div className="space-y-4 mt-auto mb-10">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 transition-transform hover:-translate-y-1 duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/10 rounded-full text-white mt-1">
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
                      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
                      <path d="M9 22v-4h6v4" />
                      <path d="M8 6h.01" />
                      <path d="M16 6h.01" />
                      <path d="M12 6h.01" />
                      <path d="M12 10h.01" />
                      <path d="M12 14h.01" />
                      <path d="M16 10h.01" />
                      <path d="M16 14h.01" />
                      <path d="M8 10h.01" />
                      <path d="M8 14h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">Acceso Corporativo</h3>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      Accede al panel de control de tu organización y herramientas de contratación.
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="bg-white text-[#111827] hover:bg-slate-100"
                      onClick={() => navigate(routes.companyLogin)}
                    >
                      Iniciar Sesión
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-transform hover:-translate-y-1 duration-300">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-full text-white/80 mt-1 border border-white/10">
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
                      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg mb-1">¿Nuevo Socio?</h3>
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      Escala tu equipo técnico con una precisión de búsqueda especializada.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-white/30 text-white hover:bg-white/10"
                      onClick={() => navigate(routes.companySignUp)}
                    >
                      Crear Cuenta
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mt-auto">
              <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                Con la confianza de 500+ Innovadores Tech
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
