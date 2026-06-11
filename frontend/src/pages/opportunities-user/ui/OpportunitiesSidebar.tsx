import { useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";

export function OpportunitiesSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="space-y-8">
      <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Cómo destacar</p>
        <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1e3456]">Antes de postular</h2>
        <div className="mt-5 space-y-3">
          {[
            "Ten listo un CV actualizado y bien enfocado al rol.",
            "Usa un mensaje breve y específico si decides agregar presentación.",
            "Practica entrevista para responder con más claridad y seguridad.",
          ].map((tip) => (
            <div key={tip} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-600">
              {tip}
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-[#dbe7f8] bg-[linear-gradient(180deg,#f7faff,#ffffff)] p-6 shadow-sm sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Accesos rápidos</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3456]">Refuerza tu candidatura antes de aplicar.</h3>
        <div className="mt-6 space-y-3">
          {[
            { label: "Crear o mejorar CV", action: () => navigate(routes.cvBuilder) },
            { label: "Practicar entrevista", action: () => navigate(routes.interview) },
            { label: "Actualizar perfil", action: () => navigate(routes.onboarding) },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="flex w-full items-center justify-between rounded-2xl border border-white bg-white/90 px-4 py-3 text-left shadow-sm transition-colors hover:border-[#294266]/20"
            >
              <span className="text-sm font-semibold text-[#1e3456]">{item.label}</span>
              <span className="text-[#294266]">
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
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

