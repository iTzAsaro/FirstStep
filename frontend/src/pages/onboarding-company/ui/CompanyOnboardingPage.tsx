import { useEffect, useMemo, useState } from "react";

import { useNavigate } from "react-router-dom";

import { useSession } from "@/entities/session";
import { routes } from "@/shared/config/routes";
import { Button, Checkbox, Input, Select } from "@/shared/ui";

const COMPANY_SIZES = [
  { value: "1-10", label: "1 - 10 personas" },
  { value: "11-50", label: "11 - 50 personas" },
  { value: "51-200", label: "51 - 200 personas" },
  { value: "201-500", label: "201 - 500 personas" },
  { value: "500+", label: "500+ personas" },
];

export function CompanyOnboardingPage() {
  const session = useSession();
  const navigate = useNavigate();
  const token = useMemo(() => localStorage.getItem("firststep.api.accessToken") ?? "", []);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [activitySector, setActivitySector] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [acceptedCompanyTerms, setAcceptedCompanyTerms] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No hay sesión válida. Vuelve a iniciar sesión.");
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/company/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("No se pudo cargar el onboarding empresarial.");
        const out = (await res.json()) as any;
        const profile = out?.profile ?? {};
        if (out?.onboardingCompleted === true) {
          session.completeOnboarding();
          navigate(routes.companyDashboard);
          return;
        }
        setCompanyName(typeof profile.companyName === "string" ? profile.companyName : "");
        setLegalName(typeof profile.legalName === "string" ? profile.legalName : "");
        setTaxId(typeof profile.taxId === "string" ? profile.taxId : "");
        setCompanySize(typeof profile.companySize === "string" ? profile.companySize : "");
        setIndustry(typeof profile.industry === "string" ? profile.industry : "");
        setActivitySector(typeof profile.activitySector === "string" ? profile.activitySector : "");
        setLocation(typeof profile.location === "string" ? profile.location : "");
        setWebsite(typeof profile.website === "string" ? profile.website : "");
        setDescription(typeof profile.description === "string" ? profile.description : "");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [navigate, session, token]);

  const canSubmit =
    !isSaving &&
    Boolean(
      companyName.trim() &&
        legalName.trim() &&
        taxId.trim() &&
        companySize.trim() &&
        industry.trim() &&
        activitySector.trim() &&
        location.trim() &&
        description.trim() &&
        verificationConfirmed &&
        acceptedCompanyTerms,
    );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !canSubmit) return;

    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/company/onboarding", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          legalName: legalName.trim(),
          taxId: taxId.trim(),
          companySize,
          industry: industry.trim(),
          activitySector: activitySector.trim(),
          location: location.trim(),
          website: website.trim() || null,
          description: description.trim(),
          verificationConfirmed,
          acceptedCompanyTerms,
        }),
      });
      if (!res.ok) {
        let message = `No se pudo completar el onboarding (${res.status}).`;
        try {
          const out = (await res.json()) as any;
          if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
        } catch {}
        throw new Error(message);
      }

      session.completeOnboarding();
      navigate(routes.companyDashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="grid lg:grid-cols-[320px,1fr]">
            <aside className="bg-[#1e3456] text-white p-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100/80 font-bold">Empresa</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">Activa tu cuenta empresarial</h1>
              <p className="mt-4 text-sm text-blue-100/85 leading-relaxed">
                Completa la información clave de tu empresa para publicar oportunidades, gestionar postulantes y abrir conversaciones privadas con candidatos.
              </p>
              <div className="mt-8 space-y-3 text-sm">
                <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
                  Datos fiscales y legales
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
                  Sector, ubicación y tamaño
                </div>
                <div className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3">
                  Verificación y términos empresariales
                </div>
              </div>
            </aside>

            <section className="p-6 md:p-8">
              {error ? (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}

              {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                  Cargando onboarding empresarial...
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Nombre comercial
                      </label>
                      <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ej. Acme Tech" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Razón social
                      </label>
                      <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ej. Acme Tech S.A.S." />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Identificación fiscal
                      </label>
                      <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="NIT / RUC / RFC" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Tamaño de plantilla
                      </label>
                      <Select value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
                        <option value="">Selecciona una opción</option>
                        {COMPANY_SIZES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Industria
                      </label>
                      <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej. Tecnología" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Sector de actividad
                      </label>
                      <Input value={activitySector} onChange={(e) => setActivitySector(e.target.value)} placeholder="Ej. SaaS B2B" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Ubicación geográfica
                      </label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ciudad, país" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Sitio web
                      </label>
                      <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://empresa.com" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                      Descripción del negocio
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full min-h-36 rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 text-sm"
                      placeholder="Cuenta qué hace tu empresa, a quién sirve y qué tipo de oportunidades publicará."
                    />
                  </div>

                  <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <label className="flex items-start gap-3 text-sm text-slate-600">
                      <Checkbox checked={verificationConfirmed} onChange={(e) => setVerificationConfirmed(e.target.checked)} />
                      <span>
                        Confirmo que los datos fiscales, legales y de actividad de la empresa son correctos y autorizo su uso para validación interna.
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-slate-600">
                      <Checkbox checked={acceptedCompanyTerms} onChange={(e) => setAcceptedCompanyTerms(e.target.checked)} />
                      <span>
                        Acepto los términos y condiciones específicos para cuentas empresariales, incluyendo tratamiento de datos de candidatos y comunicaciones privadas dentro de la plataforma.
                      </span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <Button type="button" variant="secondary" onClick={() => navigate(routes.companyLogin)}>
                      Volver
                    </Button>
                    <Button type="submit" disabled={!canSubmit}>
                      {isSaving ? "Guardando..." : "Completar onboarding empresarial"}
                    </Button>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

