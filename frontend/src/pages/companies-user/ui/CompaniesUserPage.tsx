import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useLogout } from "@/features/auth/logout/model/useLogout";
import { routes } from "@/shared/config/routes";
import { Button, Input, Select } from "@/shared/ui";

type CompanyRow = {
  id: string;
  companyName: string | null;
  industry: string | null;
  activitySector: string | null;
  location: string | null;
  companySize: string | null;
  website: string | null;
  contactEmail: string | null;
  description: string | null;
  verificationStatus: "pending" | "verified";
  updatedAt: string;
};

function getToken() {
  return localStorage.getItem("firststep.api.accessToken") ?? "";
}

function buildDirectoryUrl(params: {
  query: string;
  industry: string;
  location: string;
  companySize: string;
  verified: "all" | "verified" | "pending";
  page: number;
  pageSize: number;
}) {
  const sp = new URLSearchParams();
  if (params.query.trim()) sp.set("query", params.query.trim());
  if (params.industry.trim()) sp.set("industry", params.industry.trim());
  if (params.location.trim()) sp.set("location", params.location.trim());
  if (params.companySize.trim()) sp.set("companySize", params.companySize.trim());
  if (params.verified === "verified") sp.set("verified", "true");
  if (params.verified === "pending") sp.set("verified", "false");
  sp.set("page", String(params.page));
  sp.set("pageSize", String(params.pageSize));
  return `/api/empresas/directory?${sp.toString()}`;
}

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clampPage(page: number) {
  if (!Number.isFinite(page) || page < 1) return 1;
  return Math.floor(page);
}

export function CompaniesUserPage() {
  const navigate = useNavigate();
  const logout = useLogout();

  const token = useMemo(() => getToken(), []);

  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [verified, setVerified] = useState<"all" | "verified" | "pending">("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CompanyRow[]>([]);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(() => {
    const pages = Math.ceil(total / pageSize);
    return pages <= 0 ? 1 : pages;
  }, [pageSize, total]);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setError("No hay sesión válida. Vuelve a iniciar sesión.");
      return;
    }
    let alive = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const url = buildDirectoryUrl({ query, industry, location, companySize, verified, page, pageSize });
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
          let message = `No se pudo cargar empresas (${res.status}).`;
          try {
            const out = (await res.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }
        const out = (await res.json()) as any;
        const list = Array.isArray(out?.items) ? (out.items as CompanyRow[]) : [];
        if (!alive) return;
        setItems(list);
        setTotal(typeof out?.total === "number" ? out.total : Number(out?.total ?? 0));
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        setItems([]);
        setTotal(0);
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [companySize, industry, location, page, pageSize, query, token, verified]);

  const emptyState = !isLoading && !error && items.length === 0;

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

            <div className="hidden lg:flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
              {[
                { label: "Resumen", path: routes.dashboard },
                { label: "Oportunidades", path: routes.opportunities },
                { label: "Empresas", path: routes.companies },
                { label: "Mensajes", path: routes.messages },
                { label: "IA", path: routes.chat },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={[
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    item.path === routes.companies ? "bg-white text-[#1e3456] shadow-sm" : "text-slate-500 hover:text-[#1e3456]",
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
              onClick={logout}
              className="inline-flex rounded-full bg-[#1e3456] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-[#294266]/15 transition-colors hover:bg-[#15263d]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1400px] px-5 py-8 sm:px-6 lg:py-10">
        <header className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Directorio</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#1e3456]">Empresas</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
              Explora empresas activas en la plataforma y revisa su información pública.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-4 py-2 text-xs font-semibold text-[#294266]">
              {total} resultados
            </span>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <aside className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-[#1e3456]">Filtros</p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Búsqueda</label>
                <Input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Nombre de empresa..." />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Industria / Sector</label>
                <Input value={industry} onChange={(e) => { setIndustry(e.target.value); setPage(1); }} placeholder="Ej. Tecnología" />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Ubicación</label>
                <Input value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} placeholder="Ciudad o país" />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Tamaño</label>
                <Input value={companySize} onChange={(e) => { setCompanySize(e.target.value); setPage(1); }} placeholder="Ej. 11-50" />
              </div>

              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Verificación</label>
                <Select value={verified} onChange={(e) => { setVerified(e.target.value as any); setPage(1); }}>
                  <option value="all">Todas</option>
                  <option value="verified">Verificadas</option>
                  <option value="pending">Sin verificar</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Por página</label>
                  <Select
                    value={String(pageSize)}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      setPageSize(Number.isFinite(next) ? next : 12);
                      setPage(1);
                    }}
                  >
                    <option value="8">8</option>
                    <option value="12">12</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      setQuery("");
                      setIndustry("");
                      setLocation("");
                      setCompanySize("");
                      setVerified("all");
                      setPage(1);
                      setPageSize(12);
                    }}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-[2rem] border border-white/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
                Cargando empresas...
              </div>
            ) : error ? (
              <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
                {error}
              </div>
            ) : emptyState ? (
              <div className="rounded-[2rem] border border-white/80 bg-white p-6 text-sm text-slate-600 shadow-sm">
                No se encontraron empresas con esos filtros.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((company) => {
                  const name = safeText(company.companyName) || "Empresa";
                  const loc = safeText(company.location);
                  const ind = safeText(company.industry) || safeText(company.activitySector);
                  const desc = safeText(company.description);
                  const website = safeText(company.website);
                  const verifiedBadge =
                    company.verificationStatus === "verified" ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Verificada
                      </span>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        Sin verificar
                      </span>
                    );

                  return (
                    <div key={company.id} className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-bold text-[#1e3456]">{name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {ind ? ind : "Industria no especificada"}
                            {loc ? ` · ${loc}` : ""}
                          </p>
                        </div>
                        {verifiedBadge}
                      </div>

                      {desc ? <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">{desc}</p> : null}

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {website ? (
                          <a
                            href={website}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1.5 text-xs font-semibold text-[#294266] hover:underline"
                          >
                            Sitio web
                          </a>
                        ) : null}
                        {company.contactEmail ? (
                          <a
                            href={`mailto:${company.contactEmail}`}
                            className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1.5 text-xs font-semibold text-[#294266] hover:underline"
                          >
                            Contactar
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => navigate(`/empresas/${company.id}`)}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#294266] hover:text-[#294266]"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[2rem] border border-white/80 bg-white px-6 py-4 text-sm shadow-sm">
              <div className="text-slate-600">
                Página {page} de {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => clampPage(p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => clampPage(p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

