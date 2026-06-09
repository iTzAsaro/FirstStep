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

const GOOGLE_MAPS_API_KEY = ((import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) ?? "").trim();

type CityAutocompleteStatus = "manual" | "loading" | "ready" | "error";

type GoogleMapsWindow = Window & {
  google?: any;
  __firststepGoogleMapsPromise?: Promise<void>;
};

function loadGoogleMapsPlacesApi(apiKey: string) {
  const win = window as GoogleMapsWindow;
  if (win.google?.maps?.places) return Promise.resolve();
  if (win.__firststepGoogleMapsPromise) return win.__firststepGoogleMapsPromise;

  win.__firststepGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="firststep"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "firststep";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps."));
    document.head.appendChild(script);
  });

  return win.__firststepGoogleMapsPromise;
}

function readAddressPart(place: any, type: string, useShortName = false) {
  const component = Array.isArray(place?.address_components)
    ? place.address_components.find((entry: any) => Array.isArray(entry?.types) && entry.types.includes(type))
    : null;
  if (!component) return "";
  const value = useShortName ? component.short_name : component.long_name;
  return typeof value === "string" ? value : "";
}

function formatSelectedCity(place: any) {
  const locality =
    readAddressPart(place, "locality") ||
    readAddressPart(place, "postal_town") ||
    readAddressPart(place, "administrative_area_level_2");
  const region = readAddressPart(place, "administrative_area_level_1", true);
  const country = readAddressPart(place, "country", true);

  if (locality && region) return `${locality}, ${region}`;
  if (locality && country) return `${locality}, ${country}`;
  if (locality) return locality;
  if (typeof place?.formatted_address === "string" && place.formatted_address.trim()) return place.formatted_address.trim();
  if (typeof place?.name === "string" && place.name.trim()) return place.name.trim();
  return "";
}

export function OnboardingUserPage() {
  const session = useSession();
  const { complete, isLoading, error, clearError } = useCompleteOnboarding();

  const fileRef = useRef<HTMLInputElement | null>(null);
  const cityInputRef = useRef<HTMLInputElement | null>(null);

  const [avatarSrc, setAvatarSrc] = useState("https://i.pravatar.cc/300?img=11");
  const [fullName, setFullName] = useState(session.userName ?? "");
  const [userEmail, setUserEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [university, setUniversity] = useState("");
  const [degree, setDegree] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [careerQuery, setCareerQuery] = useState("");
  const [careerOptions, setCareerOptions] = useState<string[]>(DEFAULT_CAREERS);
  const [selectedCareers, setSelectedCareers] = useState<string[]>([
    "Desarrollo Frontend",
    "Análisis de Datos",
    "Ciberseguridad",
  ]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cityAutocompleteStatus, setCityAutocompleteStatus] = useState<CityAutocompleteStatus>(
    GOOGLE_MAPS_API_KEY ? "loading" : "manual",
  );

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const filteredCareers = useMemo(() => {
    const q = careerQuery.trim().toLowerCase();
    if (!q) return careerOptions;
    return careerOptions.filter((career) => career.toLowerCase().includes(q));
  }, [careerOptions, careerQuery]);

  const cityAutocompleteMeta = useMemo(() => {
    if (cityAutocompleteStatus === "ready") {
      return "Elige una sugerencia para guardar tu ubicación de forma clara y consistente.";
    }
    if (cityAutocompleteStatus === "loading") {
      return "Cargando sugerencias de ciudad para agilizar este paso.";
    }
    if (cityAutocompleteStatus === "error") {
      return "Puedes escribir tu ciudad manualmente mientras las sugerencias no estén disponibles.";
    }
    return "Escribe tu ciudad actual para personalizar recomendaciones y oportunidades cercanas.";
  }, [cityAutocompleteStatus]);

  const requiredChecks = useMemo(
    () => ({
      fullName: Boolean(fullName.trim()),
      city: Boolean(city.trim()),
      university: Boolean(university.trim()),
      degree: Boolean(degree.trim()),
      gradYear: /^\d{4}$/.test(gradYear.trim()),
      careerInterests: selectedCareers.length >= 3,
    }),
    [city, degree, fullName, gradYear, selectedCareers.length, university],
  );

  const completionPercentage = useMemo(() => {
    const completed = Object.values(requiredChecks).filter(Boolean).length;
    return Math.round((completed / Object.keys(requiredChecks).length) * 100);
  }, [requiredChecks]);

  const canFinish = useMemo(() => Object.values(requiredChecks).every(Boolean), [requiredChecks]);

  const selectedCareerPreview = useMemo(() => {
    if (!selectedCareers.length) return "Aun no has seleccionado intereses.";
    return selectedCareers.slice(0, 3).join(" · ");
  }, [selectedCareers]);

  const sectionStatuses = useMemo(
    () => [
      { label: "Datos de contacto", done: requiredChecks.fullName && requiredChecks.city },
      { label: "Formacion academica", done: requiredChecks.university && requiredChecks.degree && requiredChecks.gradYear },
      { label: "Intereses profesionales", done: requiredChecks.careerInterests },
    ],
    [requiredChecks],
  );

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
        if (Array.isArray(profile.careerInterests) && profile.careerInterests.length) {
          setSelectedCareers(profile.careerInterests.filter((value: unknown) => typeof value === "string"));
        }
      } catch {}
    })();

    return () => {
      alive = false;
    };
  }, [session.userName]);

  useEffect(() => {
    let alive = true;
    const token = localStorage.getItem("firststep.api.accessToken") ?? "";
    if (!token) return;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const out = (await res.json()) as any;
        const emailValue = typeof out?.user?.email === "string" ? out.user.email.trim() : "";
        if (!alive) return;
        if (emailValue) setUserEmail(emailValue);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/catalog/career-interests");
        if (!res.ok) return;
        const out = (await res.json()) as any;
        const labels = Array.isArray(out?.items)
          ? out.items
              .map((item: any) => (typeof item?.label === "string" ? item.label.trim() : ""))
              .filter(Boolean)
          : [];
        if (!alive) return;
        if (labels.length) setCareerOptions(labels);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setCityAutocompleteStatus("manual");
      return;
    }
    if (!cityInputRef.current) return;

    let cancelled = false;
    let placeChangedListener: { remove?: () => void } | null = null;
    setCityAutocompleteStatus("loading");

    void loadGoogleMapsPlacesApi(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (cancelled || !cityInputRef.current) return;
        const googleMaps = (window as GoogleMapsWindow).google;
        if (!googleMaps?.maps?.places?.Autocomplete) throw new Error("Google Places no esta disponible.");

        const autocomplete = new googleMaps.maps.places.Autocomplete(cityInputRef.current, {
          types: ["(cities)"],
          fields: ["address_components", "formatted_address", "name"],
        });

        placeChangedListener = autocomplete.addListener("place_changed", () => {
          const nextCity = formatSelectedCity(autocomplete.getPlace());
          if (!nextCity) return;
          clearError();
          setCity(nextCity);
          clearFieldError("city");
        });

        setCityAutocompleteStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setCityAutocompleteStatus("error");
      });

    return () => {
      cancelled = true;
      placeChangedListener?.remove?.();
    };
  }, [clearError]);

  const validate = () => {
    const next: Record<string, string> = {};

    if (!fullName.trim()) next.fullName = "Nombre completo es requerido.";
    if (!city.trim()) next.city = "Ciudad actual es requerida.";
    if (!university.trim()) next.university = "Universidad / Instituto es requerido.";
    if (!degree.trim()) next.degree = "Programa de grado es requerido.";

    const year = gradYear.trim();
    if (!/^\d{4}$/.test(year)) {
      next.gradYear = "Año de graduación debe ser un año de 4 dígitos.";
    } else {
      const numericYear = Number(year);
      if (numericYear < 1900 || numericYear > 2100) next.gradYear = "Año de graduación es inválido.";
    }

    const phoneDigits = phone.trim().replace(/[^\d]/g, "");
    if (phone.trim() && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
      next.phone = "Número de teléfono es inválido.";
    }

    if (selectedCareers.length < 3) next.careerInterests = "Selecciona al menos 3 opciones.";

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_28%,#f8fafc_100%)] text-slate-800 pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/70 bg-white/85 shadow-[0_24px_80px_-28px_rgba(30,52,86,0.22)] backdrop-blur">
          <div className="flex flex-col gap-6 border-b border-slate-100 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-[#e8f0fb] px-4 py-3 text-sm font-bold tracking-tight text-[#1e3456]">
                GradPath
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#5d7ba6]">Incorporacion</p>
                <p className="mt-1 text-sm text-slate-500">Crea un perfil con el formato que esperan los reclutadores.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-[#dbe7f8] bg-[#f7faff] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Perfil completado</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 w-36 overflow-hidden rounded-full bg-[#dbe7f8]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#294266,#5d85c4)] transition-all"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-[#1e3456]">{completionPercentage}%</span>
                </div>
              </div>

              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-colors hover:text-slate-600"
              >
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-5 py-8 sm:px-8 lg:px-10">
            <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(239,245,255,0.94))] p-6 shadow-[0_20px_60px_-28px_rgba(30,52,86,0.28)] sm:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Tu carta de presentacion</p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#1e3456]">Haz que tu perfil destaque.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                    Este resumen usa tu acceso con Gmail como punto de partida, pero tu puedes modificar nombre, ubicacion y el resto de datos cuando quieras.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-[#e8f0fb] px-4 py-2 text-xs font-semibold text-[#294266]">
                  Visible para reclutadores
                </span>
              </div>

              <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
                <div className="rounded-[1.75rem] border border-white/80 bg-white/80 p-5 shadow-sm">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="relative mx-auto sm:mx-0">
                      <div className="h-24 w-24 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-lg sm:h-28 sm:w-28">
                        <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-[#294266] text-white shadow-lg transition-colors hover:bg-[#1a2b44]"
                      >
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
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          setAvatarSrc(URL.createObjectURL(file));
                        }}
                      />
                    </div>

                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="text-2xl font-bold leading-tight text-[#1e3456] break-words">
                        {fullName.trim() || "Tu nombre profesional"}
                      </p>
                      <p className="mt-2 break-all text-sm leading-6 text-slate-500">{userEmail || "Tu correo de acceso"}</p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                        <span className="inline-flex items-center rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1.5 text-xs font-medium text-[#294266]">
                          {city.trim() || "Agrega tu ciudad actual"}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[#dde7f5] bg-white px-3 py-1.5 text-xs font-medium text-slate-500">
                          Perfil editable
                        </span>
                      </div>
                      <p className="mt-4 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs text-slate-500 shadow-sm">
                        Foto en PNG o JPG, max. 5 MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Prioridad de reclutadores</p>
                      <h3 className="mt-2 text-xl font-bold text-[#1e3456]">Lo que mas van a revisar</h3>
                    </div>
                    <span className="rounded-full bg-[#1e3456] px-3 py-1 text-xs font-semibold text-white">{completionPercentage}%</span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {sectionStatuses.map((section) => (
                      <div
                        key={section.label}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3",
                          section.done ? "border-emerald-200 bg-emerald-50/80" : "border-slate-200 bg-slate-50",
                        )}
                      >
                        <span className="text-sm font-medium text-slate-700">{section.label}</span>
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full",
                            section.done ? "bg-emerald-600 text-white" : "bg-white text-slate-400 border border-slate-200",
                          )}
                        >
                          {section.done ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">!</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 text-sm leading-relaxed text-slate-500">
                    Prioriza ubicacion, formacion y areas de interes. Ese contexto ayuda mucho mas que una nota promedio al momento de evaluar un perfil junior.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-[#dde7f5] bg-white/85 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Ubicacion destacada</p>
                  <p className="mt-2 text-sm font-semibold text-[#1e3456]">{city.trim() || "Completa este campo para aparecer en vacantes cercanas"}</p>
                </div>
                <div className="rounded-2xl border border-[#dde7f5] bg-white/85 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Formacion relevante</p>
                  <p className="mt-2 text-sm font-semibold text-[#1e3456]">
                    {degree.trim() || "Agrega tu programa"}{degree.trim() && university.trim() ? " · " : ""}
                    {university.trim() || "y tu universidad"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#dde7f5] bg-white/85 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Intereses clave</p>
                  <p className="mt-2 text-sm font-semibold text-[#1e3456]">{selectedCareerPreview}</p>
                </div>
              </div>
            </section>

            <main className="mt-8 space-y-6">
              <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(236,243,254,0.94))] shadow-[0_26px_70px_-34px_rgba(30,52,86,0.26)]">
                <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                  <span className="rounded-full bg-[#e8f0fb] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#294266]">
                    Incorporacion
                  </span>
                  <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#1e3456] sm:text-5xl">Diseña tu futuro.</h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
                    Completa un perfil claro, moderno y facil de revisar. Hemos reorganizado este formulario para resaltar solo la informacion que realmente aporta contexto profesional a tu candidatura.
                  </p>
                </div>

                <div className="grid gap-4 px-6 py-6 sm:px-8 lg:grid-cols-3">
                  {[
                    {
                      title: "Ubicacion y contacto",
                      desc: "Facilita matches por ciudad y permite que reclutadores te contacten rapido.",
                    },
                    {
                      title: "Formacion relevante",
                      desc: "Prioriza institucion, programa y anio de egreso, que son datos realmente utiles.",
                    },
                    {
                      title: "Intereses profesionales",
                      desc: "Muestra hacia donde quieres crecer para personalizar oportunidades y vacantes.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-[#dde7f5] bg-white/85 p-5 shadow-sm">
                      <div className="mb-3 h-10 w-10 rounded-2xl bg-[#edf3fd] text-[#294266] flex items-center justify-center">
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
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </div>
                      <p className="text-base font-bold text-[#1e3456]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.22)] sm:p-8">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#edf3fd] p-3 text-[#294266]">
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
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-[#1e3456]">Detalles personales</h2>
                      <p className="mt-1 text-sm text-slate-500">Tu informacion base debe verse clara, confiable y facil de escanear.</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-[#f7faff] px-4 py-2 text-xs font-semibold text-[#5d7ba6] border border-[#dde7f5]">
                    Informacion prioritaria
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#1e3456]">Nombre completo</label>
                    <Input
                      value={fullName}
                      onChange={(event) => {
                        clearError();
                        setFullName(event.target.value);
                        clearFieldError("fullName");
                      }}
                      placeholder="Alex Johnson"
                    />
                    {fieldErrors.fullName ? <div className="mt-2 text-[12px] text-red-600">{fieldErrors.fullName}</div> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#1e3456]">Numero de telefono</label>
                    <Input
                      value={phone}
                      type="tel"
                      onChange={(event) => {
                        clearError();
                        setPhone(event.target.value);
                        clearFieldError("phone");
                      }}
                      placeholder="+1 (555) 000-0000"
                    />
                    {fieldErrors.phone ? <div className="mt-2 text-[12px] text-red-600">{fieldErrors.phone}</div> : null}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#1e3456]">Correo</label>
                    <Input
                      value={userEmail}
                      readOnly
                      placeholder="tu-correo@gmail.com"
                      className="bg-slate-50/80 text-slate-600"
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
                          <path d="m22 7-8.991 5.727a2 2 0 0 1-2.018 0L2 7" />
                          <rect x="2" y="4" width="20" height="16" rx="2" />
                        </svg>
                      }
                      rightSlot={
                        userEmail ? (
                          <button
                            type="button"
                            className="text-[11px] font-semibold text-[#294266] hover:text-[#1a2b44] transition-colors"
                            onClick={() => {
                              void navigator.clipboard?.writeText(userEmail).catch(() => {});
                            }}
                          >
                            Copiar
                          </button>
                        ) : null
                      }
                    />
                    <p className="mt-2 text-[12px] text-slate-500 leading-relaxed">
                      Este es el correo con el que iniciaste sesión. Puedes completar tu nombre y datos y cambiarlos cuando quieras.
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <div className="rounded-[1.75rem] border border-[#d9e5f7] bg-[linear-gradient(135deg,rgba(233,241,252,0.95),rgba(255,255,255,0.98))] p-5 shadow-[0_18px_45px_-28px_rgba(41,66,102,0.35)]">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#1e3456]">Ciudad actual</label>
                          <p className="text-sm leading-6 text-slate-500">
                            Completa esta ubicacion para priorizar ofertas cercanas y dar contexto rapido sobre tu disponibilidad geografica.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/85 px-2.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#294266]" />
                            Solo ciudades
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/85 px-2.5 py-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#7c93b6]" />
                            Perfil consistente
                          </span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <Input
                          ref={cityInputRef}
                          value={city}
                          onChange={(event) => {
                            clearError();
                            setCity(event.target.value);
                            clearFieldError("city");
                          }}
                          placeholder="Ej. Bogota, CO"
                          className="border border-white/70 bg-white shadow-sm"
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
                          rightSlot={
                            cityAutocompleteStatus === "loading" ? (
                              <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#294266]/20 border-t-[#294266]" />
                            ) : cityAutocompleteStatus === "ready" ? (
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
                                className="text-emerald-600"
                              >
                                <path d="M20 6 9 17l-5-5" />
                              </svg>
                            ) : (
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
                                <path d="M12 3v18" />
                                <path d="M3 12h18" />
                              </svg>
                            )
                          }
                        />
                        <p className="mt-3 text-[12px] leading-6 text-slate-500">{cityAutocompleteMeta}</p>
                      </div>
                    </div>
                    {fieldErrors.city ? <div className="mt-2 text-[12px] text-red-600">{fieldErrors.city}</div> : null}
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.22)] sm:p-8">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#edf3fd] p-3 text-[#294266]">
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
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-[#1e3456]">Formacion academica</h2>
                      <p className="mt-1 text-sm text-slate-500">Destaca institucion, programa y año de egreso. Esa informacion pesa mucho mas que una nota promedio.</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-[#f7faff] px-4 py-2 text-xs font-semibold text-[#5d7ba6] border border-[#dde7f5]">
                    Sin promedio academico
                  </div>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-12">
                  <div className="md:col-span-12">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#1e3456]">Universidad / instituto</label>
                    <Input
                      value={university}
                      onChange={(event) => {
                        clearError();
                        setUniversity(event.target.value);
                        clearFieldError("university");
                      }}
                      placeholder="Universidad de Stanford"
                    />
                    {fieldErrors.university ? <div className="mt-2 text-[12px] text-red-600">{fieldErrors.university}</div> : null}
                  </div>

                  <div className="md:col-span-8">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#1e3456]">Programa de grado</label>
                    <Input
                      value={degree}
                      onChange={(event) => {
                        clearError();
                        setDegree(event.target.value);
                        clearFieldError("degree");
                      }}
                      placeholder="Lic. Ciencias de la Computacion"
                    />
                    {fieldErrors.degree ? <div className="mt-2 text-[12px] text-red-600">{fieldErrors.degree}</div> : null}
                  </div>

                  <div className="md:col-span-4">
                    <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-[#1e3456]">Año de egreso</label>
                    <Input
                      value={gradYear}
                      inputMode="numeric"
                      onChange={(event) => {
                        clearError();
                        setGradYear(event.target.value);
                        clearFieldError("gradYear");
                      }}
                      placeholder="2024"
                    />
                    {fieldErrors.gradYear ? <div className="mt-2 text-[12px] text-red-600">{fieldErrors.gradYear}</div> : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      title: "Institucion reconocible",
                      desc: "Ayuda a contextualizar tu base academica y entorno formativo.",
                    },
                    {
                      title: "Programa claro",
                      desc: "Permite al reclutador entender rapido tu enfoque de especialidad.",
                    },
                    {
                      title: "Egreso reciente",
                      desc: "Da visibilidad inmediata a tu etapa profesional actual.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-sm font-bold text-[#1e3456]">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-28px_rgba(15,23,42,0.22)] sm:p-8">
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#edf3fd] p-3 text-[#294266]">
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
                      <h2 className="text-2xl font-bold tracking-tight text-[#1e3456]">Intereses profesionales</h2>
                      <p className="mt-1 text-sm text-slate-500">Selecciona minimo tres areas para mostrar enfoque, curiosidad y afinidad con ciertos roles.</p>
                    </div>
                  </div>
                  <div className="rounded-full bg-[#1e3456] px-4 py-2 text-xs font-semibold text-white">
                    {selectedCareers.length} seleccionadas
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
                  <div>
                    <Input
                      value={careerQuery}
                      onChange={(event) => setCareerQuery(event.target.value)}
                      placeholder="Buscar roles o industrias (ej. Diseño, Finanzas)"
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

                    <div className="mt-5 flex flex-wrap gap-3">
                      {filteredCareers.map((career) => {
                        const selected = selectedCareers.includes(career);
                        return (
                          <button
                            key={career}
                            type="button"
                            onClick={() => {
                              clearError();
                              setSelectedCareers((prev) => {
                                if (prev.includes(career)) return prev.filter((item) => item !== career);
                                return [...prev, career];
                              });
                              clearFieldError("careerInterests");
                            }}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-sm transition-all",
                              selected
                                ? "border-transparent bg-[linear-gradient(135deg,#294266,#5d85c4)] text-white shadow-lg shadow-[#294266]/20"
                                : "border-slate-200 bg-white text-slate-600 hover:border-[#294266] hover:text-[#294266]",
                            )}
                          >
                            <span className="inline-flex items-center gap-2 font-medium">
                              {career}
                              {selected ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
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
                    {fieldErrors.careerInterests ? <div className="mt-4 text-[12px] text-red-600">{fieldErrors.careerInterests}</div> : null}
                  </div>

                  <div className="rounded-[1.75rem] border border-[#dde7f5] bg-[linear-gradient(180deg,#f7faff,#ffffff)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Resumen visible</p>
                    <h3 className="mt-2 text-xl font-bold text-[#1e3456]">Tus fortalezas clave</h3>
                    <div className="mt-5 space-y-3">
                      {selectedCareers.slice(0, 5).map((career, index) => (
                        <div key={career} className="flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0fb] text-xs font-bold text-[#294266]">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-[#1e3456]">{career}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-sm leading-6 text-slate-500">
                      Tus intereses ayudan a resaltar afinidad con roles, industrias y rutas de crecimiento.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-[#dce8f8] bg-[linear-gradient(135deg,rgba(234,242,253,0.95),rgba(255,255,255,0.98))] p-6 shadow-[0_18px_45px_-28px_rgba(30,52,86,0.25)] sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Revision final</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3456]">Deja un perfil profesional, moderno y facil de evaluar.</h2>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Al finalizar, aceptas nuestros terminos y habilitas recomendaciones acordes a tu etapa, ciudad y objetivos profesionales.
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:w-auto">
                    <Button
                      type="button"
                      disabled={!canFinish || isLoading}
                      className="w-full justify-center rounded-full bg-[#243f65] px-8 py-4 shadow-lg shadow-[#243f65]/20 hover:bg-[#15263d] sm:w-auto"
                      onClick={async () => {
                        if (!validate()) return;
                        await complete({
                          fullName: fullName.trim(),
                          phone: phone.trim() ? phone.trim() : null,
                          city: city.trim(),
                          university: university.trim(),
                          degree: degree.trim(),
                          gradYear: gradYear.trim(),
                          gpa: null,
                          careerInterests: selectedCareers,
                        });
                      }}
                    >
                      {isLoading ? "Guardando..." : canFinish ? "Finalizar perfil" : "Completa los campos clave"}
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
                    <p className="text-center text-xs text-slate-500 sm:text-right">
                      {canFinish ? "Tu perfil ya tiene la informacion esencial para empezar." : "Faltan campos prioritarios por completar."}
                    </p>
                  </div>
                </div>
                {error ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
              </section>
            </main>
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-[11px] text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2024 GradPath. Tu viaje profesional comienza aqui.</p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <a href="#" className="transition-colors hover:text-slate-600">
              Politica de Privacidad
            </a>
            <a href="#" className="transition-colors hover:text-slate-600">
              Terminos de Servicio
            </a>
            <a href="#" className="transition-colors hover:text-slate-600">
              Centro de Ayuda
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
