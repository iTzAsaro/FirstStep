// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     LandingPage.tsx                                         ║
// ║ Módulo:      frontend/src/pages/landing/ui                           ║
// ║ Descripción: Landing pública con secciones informativas y accesos.   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { Link } from "react-router-dom";

import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui";

/**
 * Renderiza la página de inicio pública (marketing) con anclas de navegación y
 * accesos a login/registro para talento y empresas.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={routes.home} className="font-bold text-[#1e3456] text-xl tracking-tight">
            FirsTep
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#como-funciona" className="hover:text-slate-900 transition-colors">
              Cómo funciona
            </a>
            <a href="#beneficios" className="hover:text-slate-900 transition-colors">
              Beneficios
            </a>
            <a href="#para-empresas" className="hover:text-slate-900 transition-colors">
              Empresas
            </a>
            <a href="#acceso" className="hover:text-slate-900 transition-colors">
              Acceso
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#acceso"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Acceder
            </a>
            <Link to={routes.talentSignUp}>
              <Button size="sm" className="rounded-full px-5">
                Crear cuenta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#5d85c4]/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#294266]/10 rounded-full blur-3xl" />
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e5edfa] text-[#294266] text-[11px] font-bold tracking-widest uppercase">
                Tu primer paso
                <span className="w-1.5 h-1.5 rounded-full bg-[#294266]" />
                hacia una carrera real
              </div>
              <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight text-[#1e3456] leading-[1.05]">
                Conecta con oportunidades{" "}
                <span className="text-[#5d85c4]">personalizadas</span> desde el día 1.
              </h1>
              <p className="mt-6 text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
                FirsTep impulsa tu crecimiento con un perfil claro, orientación accionable y un panel
                para seguir tu progreso. Para talento y para empresas: el mismo estándar, una mejor
                experiencia.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to={routes.talentSignUp} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-full px-8 py-4">
                    Registro talento
                  </Button>
                </Link>
                <Link to={routes.companySignUp} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto rounded-full px-8 py-4 border-slate-300"
                  >
                    Registro empresa
                  </Button>
                </Link>
              </div>
              <div className="mt-4 text-sm text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
                <span>¿Ya tienes cuenta?</span>
                <Link to={routes.login} className="font-semibold text-[#1e3456] hover:underline">
                  Login talento
                </Link>
                <span className="text-slate-300">/</span>
                <Link
                  to={routes.companyLogin}
                  className="font-semibold text-[#1e3456] hover:underline"
                >
                  Login empresa
                </Link>
              </div>

              <div className="mt-10 grid grid-cols-3 gap-6 max-w-lg">
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-2xl font-bold text-[#1e3456]">12k+</p>
                  <p className="text-xs text-slate-500 mt-1">Talentos en la comunidad</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-2xl font-bold text-[#1e3456]">92%</p>
                  <p className="text-xs text-slate-500 mt-1">Match promedio</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                  <p className="text-2xl font-bold text-[#1e3456]">24h</p>
                  <p className="text-xs text-slate-500 mt-1">Tiempo de respuesta</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-[#1e3456] rounded-[2rem] p-8 md:p-10 text-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#1e3456]/80 via-[#1e3456]/85 to-[#1e3456] " />
                <div className="relative">
                  <h2 className="text-2xl font-bold tracking-tight">Panel inteligente</h2>
                  <p className="text-blue-100/80 text-sm mt-2 leading-relaxed">
                    Visualiza tu progreso y mantén el control: onboarding, seguimiento y
                    recomendaciones en un solo lugar.
                  </p>

                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-bold">
                        Recomendaciones
                      </p>
                      <p className="mt-3 text-3xl font-bold">8</p>
                      <p className="mt-1 text-xs text-blue-100/80">Matches activos</p>
                    </div>
                    <div className="bg-white/10 border border-white/15 rounded-2xl p-5 backdrop-blur">
                      <p className="text-[10px] uppercase tracking-widest text-blue-100/80 font-bold">
                        Perfil
                      </p>
                      <p className="mt-3 text-3xl font-bold">3/3</p>
                      <p className="mt-1 text-xs text-blue-100/80">Pasos completos</p>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between rounded-2xl bg-white/10 border border-white/15 p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center">
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
                          <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Optimiza tu primera impresión</p>
                        <p className="text-xs text-blue-100/80">Perfil + portafolio + enfoque</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-blue-100/80">
                      Pro tip
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="acceso" className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                Acceso
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1e3456] tracking-tight">
                Elige tu tipo de cuenta.
              </h2>
              <p className="mt-3 text-slate-600 max-w-2xl">
                Tenemos login y registro separados para talento y empresas.
              </p>
            </div>
            <Link to={routes.portal} className="md:self-end">
              <Button variant="secondary" className="rounded-full">
                Ir al portal
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Talento</p>
              <h3 className="mt-3 text-xl font-bold text-[#1e3456]">Cuenta personal</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Crea tu perfil, completa el onboarding y gestiona tu progreso.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to={routes.login} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-full px-7">Login</Button>
                </Link>
                <Link to={routes.talentSignUp} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto rounded-full px-7 border-slate-300">
                    Registro
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-[#111827] rounded-[2rem] border border-white/10 p-8 shadow-sm text-white">
              <p className="text-[11px] font-bold tracking-widest uppercase text-white/60">Empresas</p>
              <h3 className="mt-3 text-xl font-bold">Cuenta corporativa</h3>
              <p className="mt-2 text-sm text-white/70 leading-relaxed">
                Accede al dashboard de empresa y gestiona procesos de contratación.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link to={routes.companyLogin} className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto rounded-full px-7 bg-white !text-black hover:bg-slate-100">
                    Login
                  </Button>
                </Link>
                <Link to={routes.companySignUp} className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto rounded-full px-7 border-white/30 text-white hover:bg-white/10">
                    Registro
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                Cómo funciona
              </p>
              <h2 className="mt-3 text-3xl md:text-4xl font-bold text-[#1e3456] tracking-tight">
                Un flujo simple, resultados claros.
              </h2>
            </div>
            <Link to={routes.portal} className="md:self-end">
              <Button variant="secondary" className="rounded-full">
                Probar flujo (mock)
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Crea tu perfil",
                desc: "Completa tu información clave y define tu trayectoria profesional.",
              },
              {
                title: "Recibe recomendaciones",
                desc: "Obtén matches y oportunidades basadas en tu enfoque y preferencias.",
              },
              {
                title: "Gestiona tu progreso",
                desc: "Usa el dashboard para dar seguimiento y mantenerte consistente.",
              },
            ].map((step, idx) => (
              <div
                key={step.title}
                className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#e5edfa] text-[#294266] flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#1e3456]">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="beneficios" className="bg-white border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <h2 className="text-3xl md:text-4xl font-bold text-[#1e3456] tracking-tight">
                Diseñado para mantenerte enfocado.
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Componentes reutilizables, buenas prácticas y una interfaz clara para que el producto
                crezca sin perder consistencia.
              </p>
              <div className="mt-8 flex gap-3">
                <Link to={routes.portal}>
                  <Button className="rounded-full px-7">Ir al portal</Button>
                </Link>
                <Link to={routes.dashboard}>
                  <Button variant="outline" className="rounded-full px-7 border-slate-300">
                    Ver dashboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "Onboarding guiado",
                  desc: "Un flujo visual para completar tu perfil con lo esencial.",
                },
                {
                  title: "UI premium",
                  desc: "Diseño moderno con Tailwind, consistente y escalable.",
                },
                {
                  title: "Accesos claros",
                  desc: "Rutas y pantallas separadas para talento y empresas.",
                },
                {
                  title: "Calidad automatizada",
                  desc: "Typecheck y react-doctor para mantener el estándar.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-[2rem] border border-slate-100 p-8 bg-[#f8fafc]"
                >
                  <h3 className="text-lg font-bold text-[#1e3456]">{card.title}</h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="para-empresas" className="max-w-6xl mx-auto px-4 py-16">
          <div className="bg-[#111827] rounded-[2rem] overflow-hidden relative">
            <div className="absolute inset-0 opacity-25 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#111827]/80 via-[#111827]/85 to-[#111827]" />
            <div className="relative px-8 py-12 md:px-12 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
                  Para empresas
                </p>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Contrata con más señal, menos ruido.
                </h2>
                <p className="mt-4 text-slate-300 leading-relaxed max-w-2xl">
                  Acceso corporativo para gestionar talento, entrevistas y actividad reciente con una
                  interfaz clara y lista para escalar.
                </p>
              </div>
              <div className="lg:col-span-5 flex flex-col gap-3">
                <Link to={routes.companySignUp}>
                  <Button className="w-full rounded-full px-8 py-4 bg-white text-[#111827] hover:bg-slate-100">
                    Crear cuenta de empresa
                  </Button>
                </Link>
                <Link to={routes.portal}>
                  <Button variant="outline" className="w-full rounded-full px-8 py-4 border-white/30 text-white hover:bg-white/10">
                    Entrar al portal
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <span className="font-bold text-[#1e3456] text-lg tracking-tight block mb-1">FirsTep</span>
            <p className="text-[11px] text-slate-400">© 2026 FirsTep. Todos los derechos reservados.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-slate-500">
            <a href="#como-funciona" className="hover:text-[#1e3456] transition-colors">
              Cómo funciona
            </a>
            <a href="#beneficios" className="hover:text-[#1e3456] transition-colors">
              Beneficios
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
