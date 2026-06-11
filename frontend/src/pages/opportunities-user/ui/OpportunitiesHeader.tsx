type Props = {
  availableCount: number;
  appliedCount: number;
  interests: string[];
};

export function OpportunitiesHeader({ availableCount, appliedCount, interests }: Props) {
  return (
    <section className="mb-8 rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">
            Oportunidades activas
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#1e3456] sm:text-4xl">
            Explora vacantes y postúlate con claridad.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
            Revisa oportunidades alineadas con tu perfil, filtra lo más relevante y enfócate en las posiciones con mejor potencial para ti.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Disponibles</p>
            <p className="mt-1 text-lg font-bold text-[#1e3456]">{availableCount}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Postuladas</p>
            <p className="mt-1 text-lg font-bold text-[#1e3456]">{appliedCount}</p>
          </div>
        </div>
      </div>

      {interests.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2.5">
          {interests.map((interest) => (
            <span
              key={interest}
              className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
            >
              {interest}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

