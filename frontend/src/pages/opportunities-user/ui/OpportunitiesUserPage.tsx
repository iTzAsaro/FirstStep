import { useEffect, useMemo, useReducer } from "react";

import { useLogout } from "@/features/auth/logout/model/useLogout";

import { OpportunitiesApplyModal, type ApplyModalState } from "./OpportunitiesApplyModal";
import { OpportunitiesFilters } from "./OpportunitiesFilters";
import { OpportunitiesHeader } from "./OpportunitiesHeader";
import { OpportunitiesList, type JobRow } from "./OpportunitiesList";
import { OpportunitiesSidebar } from "./OpportunitiesSidebar";
import { OpportunitiesTopNav } from "./OpportunitiesTopNav";

function getToken() {
  return localStorage.getItem("firststep.api.accessToken") ?? "";
}

export function OpportunitiesUserPage() {
  const logout = useLogout();

  type State = {
    isLoading: boolean;
    loadError: string | null;
    data: any;
    jobs: JobRow[];
    search: string;
    statusFilter: "all" | "new" | "applied";
    employmentFilter: "all" | string;
    applyModal: ApplyModalState;
    coverLetter: string;
    applyLoading: boolean;
    applyError: string | null;
  };

  type Action =
    | { type: "load_start" }
    | { type: "load_success"; payload: { data: any; jobs: JobRow[] } }
    | { type: "load_error"; payload: { message: string } }
    | { type: "search"; payload: { value: string } }
    | { type: "status_filter"; payload: { value: "all" | "new" | "applied" } }
    | { type: "employment_filter"; payload: { value: "all" | string } }
    | { type: "open_apply"; payload: { modal: Exclude<ApplyModalState, null> } }
    | { type: "close_apply" }
    | { type: "cover_letter"; payload: { value: string } }
    | { type: "apply_start" }
    | { type: "apply_error"; payload: { message: string } }
    | { type: "apply_success"; payload: { jobs: JobRow[] } };

  const [state, dispatch] = useReducer(
    (prev: State, action: Action): State => {
      switch (action.type) {
        case "load_start":
          return { ...prev, isLoading: true, loadError: null };
        case "load_success":
          return { ...prev, isLoading: false, loadError: null, data: action.payload.data, jobs: action.payload.jobs };
        case "load_error":
          return { ...prev, isLoading: false, loadError: action.payload.message };
        case "search":
          return { ...prev, search: action.payload.value };
        case "status_filter":
          return { ...prev, statusFilter: action.payload.value };
        case "employment_filter":
          return { ...prev, employmentFilter: action.payload.value };
        case "open_apply":
          return { ...prev, applyModal: action.payload.modal, coverLetter: "", applyError: null };
        case "close_apply":
          return { ...prev, applyModal: null, coverLetter: "", applyError: null, applyLoading: false };
        case "cover_letter":
          return { ...prev, coverLetter: action.payload.value };
        case "apply_start":
          return { ...prev, applyLoading: true, applyError: null };
        case "apply_error":
          return { ...prev, applyLoading: false, applyError: action.payload.message };
        case "apply_success":
          return { ...prev, applyLoading: false, applyError: null, applyModal: null, coverLetter: "", jobs: action.payload.jobs };
        default:
          return prev;
      }
    },
    {
      isLoading: true,
      loadError: null,
      data: null,
      jobs: [],
      search: "",
      statusFilter: "all",
      employmentFilter: "all",
      applyModal: null,
      coverLetter: "",
      applyLoading: false,
      applyError: null,
    } satisfies State,
  );

  useEffect(() => {
    let alive = true;
    const token = getToken();
    if (!token) {
      dispatch({ type: "load_error", payload: { message: "No hay sesión válida. Vuelve a iniciar sesión." } });
      return;
    }

    const load = async () => {
      try {
        dispatch({ type: "load_start" });

        const [dashboardRes, jobsRes] = await Promise.all([
          fetch("/api/talent/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/talent/jobs", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!dashboardRes.ok) {
          let message = `No se pudo cargar tu contexto (${dashboardRes.status}).`;
          try {
            const out = (await dashboardRes.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }

        if (!jobsRes.ok) {
          let message = `No se pudieron cargar las oportunidades (${jobsRes.status}).`;
          try {
            const out = (await jobsRes.json()) as any;
            if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
          } catch { }
          throw new Error(message);
        }

        const dashboardOut = await dashboardRes.json();
        const jobsOut = (await jobsRes.json()) as { jobs?: JobRow[] };

        if (!alive) return;
        dispatch({
          type: "load_success",
          payload: { data: dashboardOut, jobs: Array.isArray(jobsOut.jobs) ? jobsOut.jobs : [] },
        });
      } catch (error) {
        if (!alive) return;
        dispatch({ type: "load_error", payload: { message: error instanceof Error ? error.message : String(error) } });
      }
    };

    void load();
    return () => {
      alive = false;
    };
  }, []);

  const interests = Array.isArray(state.data?.profile?.careerInterests)
    ? (state.data.profile.careerInterests as string[]).slice(0, 4)
    : [];

  const employmentOptions = useMemo(() => {
    const values = Array.from(new Set(state.jobs.map((job) => job.employmentType).filter(Boolean)));
    return values;
  }, [state.jobs]);

  const filteredJobs = useMemo(() => {
    const query = state.search.trim().toLowerCase();
    return state.jobs.filter((job) => {
      if (state.statusFilter === "applied" && !job.hasApplied) return false;
      if (state.statusFilter === "new" && job.hasApplied) return false;
      if (state.employmentFilter !== "all" && job.employmentType !== state.employmentFilter) return false;
      if (!query) return true;
      const haystack = [
        job.title,
        job.companyName ?? "",
        job.location ?? "",
        job.seniority,
        job.description,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [state.employmentFilter, state.jobs, state.search, state.statusFilter]);

  const appliedCount = state.jobs.filter((job) => job.hasApplied).length;
  const availableCount = state.jobs.filter((job) => !job.hasApplied).length;

  return (
    <div className="min-h-screen flex flex-col text-slate-800 bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_24%,#f8fafc_100%)]">
      <OpportunitiesApplyModal
        modal={state.applyModal}
        coverLetter={state.coverLetter}
        isSubmitting={state.applyLoading}
        error={state.applyError}
        onClose={() => dispatch({ type: "close_apply" })}
        onCoverLetterChange={(value) => dispatch({ type: "cover_letter", payload: { value } })}
        onSubmit={async (jobId) => {
          const token = getToken();
          if (!token) {
            dispatch({ type: "apply_error", payload: { message: "No hay sesión válida. Vuelve a iniciar sesión." } });
            return;
          }

          dispatch({ type: "apply_start" });
          try {
            const res = await fetch(`/api/talent/jobs/${jobId}/apply`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ coverLetter: state.coverLetter.trim() ? state.coverLetter.trim() : null }),
            });
            if (!res.ok) {
              let message = `No se pudo postular (${res.status}).`;
              try {
                const out = (await res.json()) as any;
                if (typeof out?.error?.message === "string" && out.error.message) message = out.error.message;
              } catch { }
              throw new Error(message);
            }
            const jobsToken = getToken();
            if (!jobsToken) throw new Error("No hay sesión válida. Vuelve a iniciar sesión.");
            const refreshRes = await fetch("/api/talent/jobs", { headers: { Authorization: `Bearer ${jobsToken}` } });
            if (!refreshRes.ok) throw new Error("No se pudieron actualizar las oportunidades.");
            const refreshOut = (await refreshRes.json()) as { jobs?: JobRow[] };
            dispatch({
              type: "apply_success",
              payload: { jobs: Array.isArray(refreshOut.jobs) ? refreshOut.jobs : [] },
            });
          } catch (error) {
            dispatch({ type: "apply_error", payload: { message: error instanceof Error ? error.message : String(error) } });
          }
        }}
      />

      <OpportunitiesTopNav onLogout={logout} />

      <main className="mx-auto w-full max-w-[1400px] flex-1 px-5 py-8 sm:px-6 lg:py-10">
        {state.isLoading ? (
          <div className="mb-8 rounded-3xl border border-white/80 bg-white p-5 text-sm text-slate-600 shadow-sm">
            Cargando oportunidades...
          </div>
        ) : state.loadError ? (
          <div className="mb-8 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            {state.loadError}
          </div>
        ) : null}

        <OpportunitiesHeader availableCount={availableCount} appliedCount={appliedCount} interests={interests} />

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.7fr)_340px]">
          <section className="rounded-[2rem] border border-white/80 bg-white p-6 shadow-sm sm:p-7">
            <OpportunitiesFilters
              search={state.search}
              statusFilter={state.statusFilter}
              employmentFilter={state.employmentFilter}
              employmentOptions={employmentOptions}
              resultsCount={filteredJobs.length}
              onSearchChange={(value) => dispatch({ type: "search", payload: { value } })}
              onStatusFilterChange={(value) => dispatch({ type: "status_filter", payload: { value } })}
              onEmploymentFilterChange={(value) => dispatch({ type: "employment_filter", payload: { value } })}
            />

            <OpportunitiesList
              jobs={filteredJobs}
              onOpenApply={(modal) => dispatch({ type: "open_apply", payload: { modal } })}
            />
          </section>

          <OpportunitiesSidebar />
        </div>
      </main>
    </div>
  );
}
