// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     OnboardingUserPage.tsx                                  ║
// ║ Módulo:      frontend/src/pages/onboarding-user/ui                   ║
// ║ Descripción: Pantalla de onboarding para completar perfil (mock).    ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { useEffect, useMemo, useRef, useState } from "react";

import { useSession } from "@/entities/session";
import { useCompleteOnboarding } from "@/features/onboarding/complete-profile/model/useCompleteOnboarding";
import { cn } from "@/shared/lib/cn";
import { Button, Input } from "@/shared/ui";

const DEFAULT_CAREERS = [
  "Desarrollo Frontend",
  "Análisis de Datos",
  "Ciberseguridad",
  "Diseño UX/UI",
  "Gestión de Producto",
  "Marketing Digital",
  "Machine Learning",
  "Arquitectura Cloud",
];

/**
 * Renderiza el flujo de onboarding para completar información del perfil.
 * Al finalizar, marca la sesión como "onboarded" y redirige al dashboard.
 */
export function OnboardingUserPage() {
  const session = useSession();
  const { complete, isLoading, error, clearError } = useCompleteOnboarding();

  const fileRef = useRef<HTMLInputElement | null>(null);

  const [avatarSrc, setAvatarSrc] = useState("https://i.pravatar.cc/300?img=11");
  const [fullName, setFullName] = useState(session.userName ?? "");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [gpa, setGpa] = useState("");

  const [careerQuery, setCareerQuery] = useState("");
  const [selectedCareers, setSelectedCareers] = useState<string[]>([
    "Desarrollo Frontend",
    "Análisis de Datos",
    "Ciberseguridad",
  ]);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const filteredCareers = useMemo(() => {
    const q = careerQuery.trim().toLowerCase();
    if (!q) return DEFAULT_CAREERS;
    return DEFAULT_CAREERS.filter((c) => c.toLowerCase().includes(q));
  }, [careerQuery]);

  const isProfileComplete = useMemo(() => {
    const name = fullName.trim();
    const cityValue = city.trim();
    const uni = university.trim();
    const deg = degree.trim();
    const year = gradYear.trim();
    return Boolean(name && cityValue && uni && deg && /^\d{4}$/.test(year) && selectedCareers.length >= 3);
  }, [city, degree, fullName, gradYear, selectedCareers.length, university]);

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem("firststep.api.accessToken") ?? "";
    if (!token) return;

    (async () => {
      try {
        const res = await fetch("/api/talent/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const out = (await res.json()) as any;
        const profile = out?.profile;
        if (!alive || !profile) return;

        setFullName(typeof profile.fullName === "string" ? profile.fullName : session.userName ?? "");
        setPhone(typeof profile.phone === "string" ? profile.phone : "");
        setCity(typeof profile.location === "string" ? profile.location : "");
        setUniversity(typeof profile.university === "string" ? profile.university : "");
        setDegree(typeof profile.degree === "string" ? profile.degree : "");
        setGradYear(profile.gradYear ? String(profile.gradYear) : "");
        setGpa(typeof profile.gpa === "string" ? profile.gpa : "");
        if (Array.isArray(profile.careerInterests) && profile.careerInterests.length) {
          setSelectedCareers(profile.careerInterests.filter((v: any) => typeof v === "string"));
        }
      } catch { }
    })();

    return () => {
      alive = false;
    };
  }, [session.userName]);

  const canFinish = useMemo(() => {
    const name = fullName.trim();
    const cityValue = city.trim();
    const uni = university.trim();
    const deg = degree.trim();
    const year = gradYear.trim();
    return Boolean(
      name &&
      cityValue &&
      uni &&
      deg &&
      /^\d{4}$/.test(year) &&
      selectedCareers.length >= 3,
    );
  }, [city, degree, fullName, gradYear, selectedCareers.length, university]);

  const validate = () => {
    const next: Record<string, string> = {};

    const name = fullName.trim();
    if (!name) next.fullName = "Nombre completo es requerido.";

    const cityValue = city.trim();
    if (!cityValue) next.city = "Ciudad actual es requerida.";

    const uni = university.trim();
    if (!uni) next.university = "Universidad / Instituto es requerido.";

    const deg = degree.trim();
    if (!deg) next.degree = "Programa de grado es requerido.";

    const year = gradYear.trim();
    if (!/^\d{4}$/.test(year)) {
      next.gradYear = "Año de graduación debe ser un año de 4 dígitos.";
    } else {
      const y = Number(year);
      if (y < 1900 || y > 2100) next.gradYear = "Año de graduación es inválido.";
    }

    const phoneValue = phone.trim();
    if (phoneValue) {
      const digits = phoneValue.replace(/[^\d]/g, "");
      if (digits.length < 7 || digits.length > 15) next.phone = "Número de teléfono es inválido.";
    }

    const gpaValue = gpa.trim();
    if (gpaValue) {
      const n = Number(gpaValue);
      if (!Number.isFinite(n) || n < 0 || n > 5) next.gpa = "Promedio es inválido.";
    }

    if (selectedCareers.length < 3) next.careerInterests = "Selecciona al menos 3 opciones.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col items-center bg-[#f8fafc] text-slate-800">
      <div className="w-full max-w-6xl mx-auto px-4 mt-6">
        <div className="bg-white rounded-2xl p-4 px-6 flex justify-between items-center shadow-sm">
          <span className="font-bold text-[#294266] text-lg tracking-tight">GradPath</span>
          <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
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
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
          </button>
        </div>
      </div>

      <div className="w-full max-w-3xl mx-auto px-4 mt-12 mb-10 text-center">
        <span className="inline-block bg-[#e5edfa] text-[#294266] text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-6">
          Incorporación
        </span>

        <h1 className="text-4xl md:text-5xl font-bold text-[#1e3456] mb-5 tracking-tight">
          Diseña tu futuro.
        </h1>

        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Bienvenido a FirsTep por GradPath. Tu viaje profesional es único, y comienza con un perfil
          que refleja tu verdadero potencial. Completa los detalles a continuación para desbloquear
          oportunidades personalizadas.
        </p>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-4">
          <div className="bg-white rounded-[2rem] p-8 flex flex-col items-center text-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)] sticky top-6">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-[#f1f5f9] overflow-hidden bg-slate-100">
                <img src={avatarSrc} alt="" className="w-full h-full object-cover" />
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-1 right-1 bg-[#294266] text-white p-2 rounded-full border-2 border-white hover:bg-[#1a2b44] transition-colors shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  setAvatarSrc(url);
                }}
              />
            </div>

            <h2 className="text-[#1e3456] font-bold text-xl mb-3">Foto de Perfil</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
              PNG o JPG, máx 5MB. Una foto profesional te ayuda a destacar ante los empleadores.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#f1f5f9] p-2.5 rounded-xl text-[#294266]">
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#1e3456] tracking-tight">
                Detalles Personales
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-[#1e3456] uppercase tracking-wider mb-2">
                  Nombre Completo
                </label>
                <Input
                  value={fullName}
                  onChange={(e) => {
                    clearError();
                    setFullName(e.target.value);
                    setFieldErrors((p) => {
                      const { fullName: _removed, ...rest } = p;
                      return rest;
                    });
                  }}
                  placeholder="Alex Johnson"
                />
                {fieldErrors.fullName ? <div className="text-[12px] text-red-600 mt-2">{fieldErrors.fullName}</div> : null}
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#1e3456] uppercase tracking-wider mb-2">
                  Número de Teléfono
                </label>
                <Input
                  value={phone}
                  onChange={(e) => {
                    clearError();
                    setPhone(e.target.value);
                    setFieldErrors((p) => {
                      const { phone: _removed, ...rest } = p;
                      return rest;
                    });
                  }}
                  placeholder="+1 (555) 000-0000"
                  type="tel"
                />
                {fieldErrors.phone ? <div className="text-[12px] text-red-600 mt-2">{fieldErrors.phone}</div> : null}
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold text-[#1e3456] uppercase tracking-wider mb-2">
                  Ciudad Actual
                </label>
                <Input
                  value={city}
                  onChange={(e) => {
                    clearError();
                    setCity(e.target.value);
                    setFieldErrors((p) => {
                      const { city: _removed, ...rest } = p;
                      return rest;
                    });
                  }}
                  placeholder="San Francisco, CA"
                  leftSlot={
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
                      className="text-slate-400"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  }
                />
                {fieldErrors.city ? <div className="text-[12px] text-red-600 mt-2">{fieldErrors.city}</div> : null}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-[#f1f5f9] p-2.5 rounded-xl text-[#294266]">
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
                  <path d="M22 10v6" />
                  <path d="M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#1e3456] tracking-tight">
                Historial Académico
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-12">
                <label className="block text-[11px] font-bold text-[#1e3456] uppercase tracking-wider mb-2">
                  Universidad / Instituto
                </label>
                <Input
                  value={university}
                  onChange={(e) => {
                    clearError();
                    setUniversity(e.target.value);
                    setFieldErrors((p) => {
                      const { university: _removed, ...rest } = p;
                      return rest;
                    });
                  }}
                  placeholder="Universidad de Stanford"
                />
                {fieldErrors.university ? <div className="text-[12px] text-red-600 mt-2">{fieldErrors.university}</div> : null}
              </div>
              <div className="md:col-span-6">
                <label className="block text-[11px] font-bold text-[#1e3456] uppercase tracking-wider mb-2">
                  Programa de Grado
                </label>
                <Input
                  value={degree}
                  onChange={(e) => {
                    clearError();
                    setDegree(e.target.value);
                    setFieldErrors((p) => {
                      const { degree: _removed, ...rest } = p;
                      return rest;
                    });
                  }}
                  placeholder="Lic. Ciencias de la Computación"
                />
                {fieldErrors.degree ? <div className="text-[12px] text-red-600 mt-2">{fieldErrors.degree}</div> : null}
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-[#1e3456] uppercase tracking-wider mb-2">
                  Año Grad.
                </label>
                <Input
                  value={gradYear}
                  onChange={(e) => {
                    clearError();
                    setGradYear(e.target.value);
                    setFieldErrors((p) => {
                      const { gradYear: _removed, ...rest } = p;
                      return rest;
                    });
                  }}
                  placeholder="2024"
                  inputMode="numeric"
                  className="text-center md:text-left"
                />
                {fieldErrors.gradYear ? <div className="text-[12px] text-red-600 mt-2">{fieldErrors.gradYear}</div> : null}
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-[#1e3456] uppercase tracking-wider mb-2">
                  Promedio
                </label>
                <Input
                  value={gpa}
                  onChange={(e) => {
                    clearError();
                    setGpa(e.target.value);
                    setFieldErrors((p) => {
                      const { gpa: _removed, ...rest } = p;
                      return rest;
                    });
                  }}
                  placeholder="3.8"
                  inputMode="decimal"
                  className="text-center md:text-left"
                />
                {fieldErrors.gpa ? <div className="text-[12px] text-red-600 mt-2">{fieldErrors.gpa}</div> : null}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#f1f5f9] p-2.5 rounded-xl text-[#294266]">
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
              <h2 className="text-2xl font-bold text-[#1e3456] tracking-tight">
                Trayectoria Profesional
              </h2>
            </div>

            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              ¿Qué industrias o roles te emocionan? Selecciona al menos tres para ayudarnos a
              personalizar tu feed.
            </p>

            <Input
              value={careerQuery}
              onChange={(e) => setCareerQuery(e.target.value)}
              placeholder="Buscar carreras (ej. Diseño, Finanzas)"
              leftSlot={
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
                  className="text-slate-400"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              }
            />

            <div className="flex flex-wrap gap-3 mt-6">
              {filteredCareers.map((career) => {
                const selected = selectedCareers.includes(career);
                return (
                  <button
                    key={career}
                    type="button"
                    onClick={() => {
                      clearError();
                      setSelectedCareers((prev) => {
                        if (prev.includes(career)) return prev.filter((c) => c !== career);
                        return [...prev, career];
                      });
                      setFieldErrors((p) => {
                        const { careerInterests: _removed, ...rest } = p;
                        return rest;
                      });
                    }}
                    className={cn(
                      "px-4 py-2.5 text-xs rounded-full transition-colors border",
                      selected
                        ? "bg-[#294266] text-white font-semibold border-transparent hover:bg-[#1a2b44]"
                        : "bg-white text-slate-600 border-slate-200 font-medium hover:border-[#294266] hover:text-[#294266]",
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {career}
                      {selected ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.careerInterests ? (
              <div className="text-[12px] text-red-600 mt-4">{fieldErrors.careerInterests}</div>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-6 px-2">
            <p className="text-xs text-slate-500 max-w-xs text-center sm:text-left leading-relaxed">
              Al finalizar, aceptas nuestros términos y aceptas recibir alertas de carreras.
            </p>
            <Button
              type="button"
              disabled={!canFinish || isLoading}
              className="bg-[#243f65] hover:bg-[#15263d] shadow-lg shadow-[#243f65]/20 rounded-full px-8 py-4 w-full sm:w-auto justify-center"
              onClick={async () => {
                if (!validate()) return;
                await complete({
                  fullName: fullName.trim(),
                  phone: phone.trim() ? phone.trim() : null,
                  city: city.trim(),
                  university: university.trim(),
                  degree: degree.trim(),
                  gradYear: gradYear.trim(),
                  gpa: gpa.trim() ? gpa.trim() : null,
                  careerInterests: selectedCareers,
                });
              }}
            >
              {isLoading ? "Guardando..." : isProfileComplete ? "Guardar cambios" : "Finalizar Perfil"}
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
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Button>
          </div>
          {error ? (
            <div className="mt-6 px-2">
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-4 mt-20 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-400 gap-4">
        <p>© 2024 GradPath. Tu viaje profesional comienza aquí.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-600 transition-colors">
            Política de Privacidad
          </a>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Términos de Servicio
          </a>
          <a href="#" className="hover:text-slate-600 transition-colors">
            Centro de Ayuda
          </a>
        </div>
      </div>
    </div>
  );
}
