type StatusFilter = "all" | "new" | "applied";

type Props = {
  search: string;
  statusFilter: StatusFilter;
  employmentFilter: string;
  employmentOptions: string[];
  resultsCount: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onEmploymentFilterChange: (value: string) => void;
};

export function OpportunitiesFilters({
  search,
  statusFilter,
  employmentFilter,
  employmentOptions,
  resultsCount,
  onSearchChange,
  onStatusFilterChange,
  onEmploymentFilterChange,
}: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">Explora vacantes</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#1e3456]">Oportunidades abiertas para talento</h2>
        </div>
        <span className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-4 py-2 text-xs font-semibold text-[#294266]">
          {resultsCount} resultados
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por cargo, empresa, ciudad o seniority"
            className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white px-2 py-2">
          {[
            { label: "Todas", value: "all" },
            { label: "Nuevas", value: "new" },
            { label: "Postuladas", value: "applied" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onStatusFilterChange(item.value as StatusFilter)}
              className={[
                "whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                statusFilter === item.value ? "bg-[#1e3456] text-white" : "text-slate-500 hover:text-[#1e3456]",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </div>
        <select
          value={employmentFilter}
          onChange={(e) => onEmploymentFilterChange(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
        >
          <option value="all">Todo tipo</option>
          {employmentOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

