import { useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui";

type CompanyPublic = {
  id: string;
  companyName: string | null;
  industry: string | null;
  activitySector: string | null;
  location: string | null;
  website: string | null;
  contactEmail: string | null;
  description: string | null;
  verificationStatus: "pending" | "verified";
  updatedAt: string;
};

function getToken() {
  return localStorage.getItem("firststep.api.accessToken") ?? "";
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function CompanyPublicPage() {
  const navigate = useNavigate();
  const logout = useLogout();
  const params = useParams();

  const token = useMemo(() => getToken(), []);
  const companyId = typeof params.id === "string" ? params.id : "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [company, setCompany] = useState<CompanyPublic | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError("No hay sesión válida. Vuelve a iniciar sesión.");
      return;
    }
    if (!companyId) {
      setIsLoading(false);
      setError("Empresa inválida.");
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/empresas/directory/${companyId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          let message = `No se pudo cargar la empresa (${res.status}).`;
          try {
            const out = (await res.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }
        const out = (await res.json()) as any;
        const row = out?.company ?? null;
        if (!alive) return;
        setCompany(row);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        setCompany(null);
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [companyId, token]);

  const name = safeText(company?.companyName) || "Empresa";
  const loc = safeText(company?.location);
  const ind = safeText(company?.industry) || safeText(company?.activitySector);
  const desc = safeText(company?.description);
  const website = safeText(company?.website);
  const contactEmail = safeText(company?.contactEmail);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
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
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              className="inline-flex rounded-full bg-[#1e3456] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#294266]/15 transition-colors hover:bg-[#15263d]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-6 lg:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(routes.companies)}>
            Volver al directorio
          </Button>
        </div>

        {isLoading ? (
          <div className="rounded-[2rem] border border-white/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Cargando empresa...
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        ) : company ? (
          <div className="rounded-[2rem] border border-white/80 bg-white p-7 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-2xl font-bold tracking-tight text-[#1e3456]">{name}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {ind ? ind : "Industria no especificada"}
                  {loc ? ` · ${loc}` : ""}
                </p>
              </div>
              <div>
                {company.verificationStatus === "verified" ? (
                  <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                    Verificada
                  </span>
                ) : (
                  <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                    Sin verificar
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Sitio web</p>
                {website ? (
                  <a href={website} target="_blank" rel="noreferrer" className="mt-2 block text-sm font-semibold text-[#294266] hover:underline">
                    {website}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No informado</p>
                )}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Correo de contacto</p>
                {contactEmail ? (
                  <a href={`mailto:${contactEmail}`} className="mt-2 block text-sm font-semibold text-[#294266] hover:underline">
                    {contactEmail}
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No informado</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Descripción</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {desc ? desc : "No hay descripción pública disponible."}
              </p>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

