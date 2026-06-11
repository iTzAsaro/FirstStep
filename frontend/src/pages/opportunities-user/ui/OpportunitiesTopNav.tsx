import { useNavigate } from "react-router-dom";

import { routes } from "@/shared/config/routes";

type Props = {
  onLogout: () => void;
};

export function OpportunitiesTopNav({ onLogout }: Props) {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <button type="button" onClick={() => navigate(routes.dashboard)} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#1e3456,#5d85c4)] text-sm font-bold text-white shadow-lg shadow-[#294266]/20">
              FT
            </span>
            <span className="hidden sm:block">
              <span className="block text-lg font-bold tracking-tight text-[#1e3456]">FirsTep</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Career Momentum
              </span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
            {[
              { label: "Resumen", path: routes.dashboard },
              { label: "Oportunidades", path: routes.opportunities },
              { label: "IA", path: routes.chat },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  item.path === routes.opportunities
                    ? "bg-white text-[#1e3456] shadow-sm"
                    : "text-slate-500 hover:text-[#1e3456]",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(routes.cvBuilder)}
            className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1e3456] shadow-sm transition-colors hover:border-[#294266] hover:text-[#294266]"
          >
            Mejorar CV
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex rounded-full bg-[#1e3456] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#294266]/15 transition-colors hover:bg-[#15263d]"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

