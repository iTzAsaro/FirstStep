import { Button } from "@/shared/ui";

import { formatSalary, timeAgo } from "./opportunitiesFormat";
import type { ApplyModalState } from "./OpportunitiesApplyModal";

export type JobRow = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  employmentType: string;
  seniority: string;
  salaryMin: number | null;
  salaryMax: number | null;
  companyName: string | null;
  createdAt: string;
  hasApplied: boolean;
};

type Props = {
  jobs: JobRow[];
  onOpenApply: (modal: Exclude<ApplyModalState, null>) => void;
};

export function OpportunitiesList({ jobs, onOpenApply }: Props) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-50/50">
      {jobs.length === 0 ? (
        <div className="p-6">
          <p className="text-sm text-slate-500">
            No encontramos oportunidades con esos filtros. Ajusta la búsqueda o revisa nuevamente más tarde.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {jobs.map((job) => (
            <article key={job.id} className="px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-[#1e3456]">{job.title}</h3>
                    {job.hasApplied ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Ya postulaste
                      </span>
                    ) : (
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#294266]">
                        Nueva oportunidad
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-[12px] text-slate-400">
                    {(job.companyName ?? "Empresa")}
                    {job.location ? ` · ${job.location}` : ""}
                    {` · ${job.seniority}`}
                    {` · ${job.employmentType}`}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{job.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1.5 text-xs font-semibold text-[#294266]">
                      {formatSalary(job.salaryMin, job.salaryMax)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500">
                      Publicado {timeAgo(job.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 xl:w-[180px]">
                  <Button
                    type="button"
                    size="sm"
                    variant={job.hasApplied ? "secondary" : "primary"}
                    className="w-full rounded-full px-5"
                    disabled={job.hasApplied}
                    onClick={() => onOpenApply({ jobId: job.id, title: job.title, companyName: job.companyName })}
                  >
                    {job.hasApplied ? "Aplicación enviada" : "Postular ahora"}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

