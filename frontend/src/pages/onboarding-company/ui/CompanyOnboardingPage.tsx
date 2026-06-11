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
  const [toast, setToast] = useState<null | { kind: "success" | "error"; title: string; message?: string }>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [companyName, setCompanyName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [activitySector, setActivitySector] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [acceptedCompanyTerms, setAcceptedCompanyTerms] = useState(false);
  const [rutStatus, setRutStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [rutMessage, setRutMessage] = useState<string>("");
  const [validatedRut, setValidatedRut] = useState<string>("");

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
        setValidatedRut(typeof profile.taxId === "string" ? profile.taxId : "");
        if (typeof profile.taxId === "string" && profile.taxId) {
          setRutStatus("valid");
          setRutMessage("RUT previamente validado.");
        }
        setCompanySize(typeof profile.companySize === "string" ? profile.companySize : "");
        setIndustry(typeof profile.industry === "string" ? profile.industry : "");
        setActivitySector(typeof profile.activitySector === "string" ? profile.activitySector : "");
        setLocation(typeof profile.location === "string" ? profile.location : "");
        setAddress(typeof profile.address === "string" ? profile.address : "");
        setContactEmail(typeof profile.contactEmail === "string" ? profile.contactEmail : "");
        setWebsite(typeof profile.website === "string" ? profile.website : "");
        setDescription(typeof profile.description === "string" ? profile.description : "");
        try {
          const raw = localStorage.getItem("firststep.company.onboardingDraft.v1");
          if (raw) {
            const draft = JSON.parse(raw) as any;
            if (typeof draft?.companyName === "string") setCompanyName(draft.companyName);
            if (typeof draft?.legalName === "string") setLegalName(draft.legalName);
            if (typeof draft?.taxId === "string") setTaxId(draft.taxId);
            if (typeof draft?.validatedRut === "string") setValidatedRut(draft.validatedRut);
            if (draft?.rutStatus === "valid" || draft?.rutStatus === "invalid" || draft?.rutStatus === "checking" || draft?.rutStatus === "idle") {
              setRutStatus(draft.rutStatus);
            }
            if (typeof draft?.rutMessage === "string") setRutMessage(draft.rutMessage);
            if (typeof draft?.companySize === "string") setCompanySize(draft.companySize);
            if (typeof draft?.industry === "string") setIndustry(draft.industry);
            if (typeof draft?.activitySector === "string") setActivitySector(draft.activitySector);
            if (typeof draft?.location === "string") setLocation(draft.location);
            if (typeof draft?.address === "string") setAddress(draft.address);
            if (typeof draft?.contactEmail === "string") setContactEmail(draft.contactEmail);
            if (typeof draft?.website === "string") setWebsite(draft.website);
            if (typeof draft?.description === "string") setDescription(draft.description);
            if (typeof draft?.verificationConfirmed === "boolean") setVerificationConfirmed(draft.verificationConfirmed);
            if (typeof draft?.acceptedCompanyTerms === "boolean") setAcceptedCompanyTerms(draft.acceptedCompanyTerms);
            if (draft?.step && [1, 2, 3, 4].includes(draft.step)) setStep(draft.step);
          }
        } catch { }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [navigate, session, token]);

  const formErrors = useMemo(() => {
    const next: Record<string, string> = {};
    if (!companyName.trim()) next.companyName = "El nombre comercial es obligatorio.";
    if (!legalName.trim()) next.legalName = "La razón social es obligatoria.";
    if (!taxId.trim()) next.taxId = "El RUT es obligatorio.";
    if (taxId.trim() && !/^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$/.test(taxId.trim()) && !/^\d{7,8}-[\dkK]$/.test(taxId.trim())) {
      next.taxId = "Ingresa un RUT válido, por ejemplo 12.345.678-5.";
    }
    if (!companySize.trim()) next.companySize = "Selecciona el tamaño de plantilla.";
    if (!industry.trim()) next.industry = "La industria es obligatoria.";
    if (!activitySector.trim()) next.activitySector = "El sector de actividad es obligatorio.";
    if (!location.trim()) next.location = "La ubicación (ciudad/país) es obligatoria.";
    if (!address.trim()) next.address = "La dirección es obligatoria.";
    if (!contactEmail.trim()) next.contactEmail = "El correo de contacto es obligatorio.";
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) next.contactEmail = "Ingresa un correo válido.";
    if (website.trim() && !/^https?:\/\/.+/i.test(website.trim())) next.website = "El sitio web debe iniciar con http:// o https://";
    if (!description.trim()) next.description = "La descripción del negocio es obligatoria.";
    if (description.trim() && description.trim().length < 40) next.description = "Agrega un poco más de contexto (mín. 40 caracteres).";
    if (!verificationConfirmed) next.verificationConfirmed = "Debes confirmar la verificación de datos.";
    if (!acceptedCompanyTerms) next.acceptedCompanyTerms = "Debes aceptar los términos empresariales.";
    return next;
  }, [acceptedCompanyTerms, activitySector, address, companyName, companySize, contactEmail, description, industry, legalName, location, taxId, verificationConfirmed, website]);

  const stepCanContinue = useMemo(() => {
    if (step === 1) return !formErrors.companyName && !formErrors.description && !formErrors.website;
    if (step === 2) {
      const normalizedRut = taxId.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
      return (
        !formErrors.legalName &&
        !formErrors.taxId &&
        !formErrors.companySize &&
        !formErrors.industry &&
        !formErrors.activitySector &&
        rutStatus === "valid" &&
        normalizedRut === validatedRut
      );
    }
    if (step === 3) return !formErrors.location && !formErrors.address && !formErrors.contactEmail;
    return !formErrors.verificationConfirmed && !formErrors.acceptedCompanyTerms;
  }, [activitySector, companySize, formErrors, industry, legalName, rutStatus, step, taxId, validatedRut]);

  const canSubmit = !isSaving && step === 4 && stepCanContinue;

  useEffect(() => {
    if (isLoading || !token) return;
    try {
      localStorage.setItem(
        "firststep.company.onboardingDraft.v1",
        JSON.stringify({
          step,
          companyName,
          legalName,
          taxId,
          rutStatus,
          rutMessage,
          validatedRut,
          companySize,
          industry,
          activitySector,
          location,
          address,
          contactEmail,
          website,
          description,
          verificationConfirmed,
          acceptedCompanyTerms,
        }),
      );
    } catch { }
  }, [
    acceptedCompanyTerms,
    activitySector,
    address,
    companyName,
    companySize,
    contactEmail,
    description,
    industry,
    isLoading,
    legalName,
    location,
    rutMessage,
    rutStatus,
    step,
    taxId,
    token,
    validatedRut,
    verificationConfirmed,
    website,
  ]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const normalizedRut = taxId.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
    if (!normalizedRut) {
      setRutStatus("idle");
      setRutMessage("");
      setValidatedRut("");
      return;
    }
    if (normalizedRut !== validatedRut) {
      setRutStatus("idle");
      setRutMessage("");
    }
  }, [taxId, validatedRut]);

  async function validateRut() {
    const rut = taxId.trim();
    if (!rut || formErrors.taxId) return;
    setRutStatus("checking");
    setRutMessage("Validando RUT con SII...");
    try {
      const res = await fetch("/api/company/validate-rut", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rut }),
      });
      const out = (await res.json()) as any;
      if (!res.ok) {
        const message =
          typeof out?.error?.message === "string" && out.error.message ? out.error.message : "No se pudo validar el RUT.";
        throw new Error(message);
      }
      const normalizedRut = typeof out?.rut === "string" ? out.rut : rut.replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
      setValidatedRut(normalizedRut);
      setRutStatus("valid");
      setRutMessage("RUT validado correctamente con SII.");
    } catch (e) {
      setValidatedRut("");
      setRutStatus("invalid");
      setRutMessage(e instanceof Error ? e.message : "No se pudo validar el RUT.");
    }
  }

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
          address: address.trim(),
          contactEmail: contactEmail.trim(),
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

      try {
        localStorage.removeItem("firststep.company.onboardingDraft.v1");
      } catch { }
      session.completeOnboarding();
      setToast({ kind: "success", title: "Onboarding completado" });
      navigate(routes.companyDashboard);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setToast({ kind: "error", title: "No se pudo guardar", message: e instanceof Error ? e.message : String(e) });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {toast ? (
          <div className="mb-6" role="status" aria-live="polite">
            <div
              className={`rounded-2xl border px-4 py-3 ${
                toast.kind === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{toast.title}</p>
                  {toast.message ? <p className="mt-1 text-sm opacity-90">{toast.message}</p> : null}
                </div>
                <button type="button" className="rounded-lg px-2 py-1 text-sm text-slate-700 hover:bg-white/60" onClick={() => setToast(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl bg-white border border-slate-200 shadow-[0_20px_50px_-20px_rgba(15,23,42,0.18)] overflow-hidden">
          <div className="grid lg:grid-cols-[320px,1fr]">
            <aside className="bg-[#1e3456] text-white p-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-blue-100/80 font-bold">Empresa</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight">Activa tu cuenta empresarial</h1>
              <p className="mt-4 text-sm text-blue-100/85 leading-relaxed">
                Completa la información clave de tu empresa para publicar oportunidades, gestionar postulantes y abrir conversaciones privadas con candidatos.
              </p>
              <div className="mt-8 space-y-3 text-sm">
                {[
                  { k: 1, label: "Datos generales" },
                  { k: 2, label: "Datos fiscales" },
                  { k: 3, label: "Contacto y dirección" },
                  { k: 4, label: "Verificación y términos" },
                ].map((item) => (
                  <button
                    key={item.k}
                    type="button"
                    onClick={() => setStep(item.k as any)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      step === item.k ? "border-white/30 bg-white/15" : "border-white/10 bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
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
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-500">Paso {step} de 4</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={step <= 1}
                        onClick={() => setStep((s) => (s <= 1 ? 1 : ((s - 1) as any)))}
                      >
                        Anterior
                      </Button>
                      {step < 4 ? (
                        <Button
                          type="button"
                          size="sm"
                          disabled={!stepCanContinue}
                          onClick={() => setStep((s) => (s >= 4 ? 4 : ((s + 1) as any)))}
                        >
                          Continuar
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="companyName" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Nombre comercial
                          </label>
                          <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ej. Acme Tech" />
                          {formErrors.companyName ? <p className="mt-2 text-xs text-red-700">{formErrors.companyName}</p> : null}
                        </div>
                        <div>
                          <label htmlFor="website" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Sitio web (opcional)
                          </label>
                          <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://empresa.com" />
                          {formErrors.website ? <p className="mt-2 text-xs text-red-700">{formErrors.website}</p> : null}
                        </div>
                      </div>
                      <div>
                        <label htmlFor="description" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Descripción del negocio
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full min-h-40 rounded-2xl border border-slate-200 bg-[#f8fafc] px-4 py-3 outline-none focus:ring-2 focus:ring-[#294266]/20 text-sm"
                          placeholder="Cuenta qué hace tu empresa, a quién sirve y qué tipo de oportunidades publicará."
                        />
                        {formErrors.description ? <p className="mt-2 text-xs text-red-700">{formErrors.description}</p> : null}
                      </div>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="legalName" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Razón social
                          </label>
                          <Input id="legalName" value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ej. Acme Tech S.A.S." />
                          {formErrors.legalName ? <p className="mt-2 text-xs text-red-700">{formErrors.legalName}</p> : null}
                        </div>
                        <div>
                          <label htmlFor="taxId" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            RUT
                          </label>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="flex-1">
                              <Input
                                id="taxId"
                                value={taxId}
                                onChange={(e) => setTaxId(e.target.value)}
                                onBlur={() => void validateRut()}
                                placeholder="12.345.678-5"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="secondary"
                              disabled={Boolean(formErrors.taxId) || rutStatus === "checking" || !taxId.trim()}
                              onClick={() => void validateRut()}
                            >
                              {rutStatus === "checking" ? "Validando..." : "Validar RUT"}
                            </Button>
                          </div>
                          {formErrors.taxId ? <p className="mt-2 text-xs text-red-700">{formErrors.taxId}</p> : null}
                          {!formErrors.taxId && rutMessage ? (
                            <p className={`mt-2 text-xs ${rutStatus === "valid" ? "text-emerald-700" : rutStatus === "invalid" ? "text-red-700" : "text-slate-500"}`}>
                              {rutMessage}
                            </p>
                          ) : null}
                        </div>
                        <div>
                          <label htmlFor="companySize" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Tamaño de plantilla
                          </label>
                          <Select id="companySize" value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
                            <option value="">Selecciona una opción</option>
                            {COMPANY_SIZES.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                          {formErrors.companySize ? <p className="mt-2 text-xs text-red-700">{formErrors.companySize}</p> : null}
                        </div>
                        <div>
                          <label htmlFor="industry" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Industria
                          </label>
                          <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Ej. Tecnología" />
                          {formErrors.industry ? <p className="mt-2 text-xs text-red-700">{formErrors.industry}</p> : null}
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="activitySector" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Sector de actividad
                          </label>
                          <Input id="activitySector" value={activitySector} onChange={(e) => setActivitySector(e.target.value)} placeholder="Ej. SaaS B2B" />
                          {formErrors.activitySector ? <p className="mt-2 text-xs text-red-700">{formErrors.activitySector}</p> : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="contactEmail" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Correo de contacto
                          </label>
                          <Input id="contactEmail" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="contacto@empresa.com" />
                          {formErrors.contactEmail ? <p className="mt-2 text-xs text-red-700">{formErrors.contactEmail}</p> : null}
                        </div>
                        <div>
                          <label htmlFor="location" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Ciudad / País
                          </label>
                          <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ciudad, país" />
                          {formErrors.location ? <p className="mt-2 text-xs text-red-700">{formErrors.location}</p> : null}
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="address" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Dirección
                          </label>
                          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle, número, comuna/barrio" />
                          {formErrors.address ? <p className="mt-2 text-xs text-red-700">{formErrors.address}</p> : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">{companyName.trim() || "Empresa"}</p>
                        <p className="mt-1 text-slate-600">{legalName.trim() || "Razón social pendiente"} · {taxId.trim() || "RUT pendiente"}</p>
                        <p className="mt-2 text-xs text-slate-500">{contactEmail.trim() || "Correo pendiente"} · {location.trim() || "Ubicación pendiente"}</p>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                        <label className="flex items-start gap-3 text-sm text-slate-600">
                          <Checkbox checked={verificationConfirmed} onChange={(e) => setVerificationConfirmed(e.target.checked)} />
                          <span>
                            Confirmo que los datos fiscales, legales y de actividad de la empresa son correctos y autorizo su uso para validación interna.
                          </span>
                        </label>
                        {formErrors.verificationConfirmed ? <p className="text-xs text-red-700">{formErrors.verificationConfirmed}</p> : null}
                        <label className="flex items-start gap-3 text-sm text-slate-600">
                          <Checkbox checked={acceptedCompanyTerms} onChange={(e) => setAcceptedCompanyTerms(e.target.checked)} />
                          <span>
                            Acepto los términos y condiciones específicos para cuentas empresariales, incluyendo tratamiento de datos de candidatos y comunicaciones privadas dentro de la plataforma.
                          </span>
                        </label>
                        {formErrors.acceptedCompanyTerms ? <p className="text-xs text-red-700">{formErrors.acceptedCompanyTerms}</p> : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <Button type="button" variant="secondary" onClick={() => navigate(routes.companyLogin)}>
                      Volver
                    </Button>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          try {
                            localStorage.removeItem("firststep.company.onboardingDraft.v1");
                          } catch { }
                          setToast({ kind: "success", title: "Borrador descartado" });
                        }}
                      >
                        Descartar borrador
                      </Button>
                      <Button type="submit" disabled={!canSubmit}>
                        {isSaving ? "Guardando..." : "Completar onboarding empresarial"}
                      </Button>
                    </div>
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
