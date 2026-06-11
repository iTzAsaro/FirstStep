import { Button } from "@/shared/ui";

export type ApplyModalState = null | { jobId: number; title: string; companyName: string | null };

type Props = {
  modal: ApplyModalState;
  coverLetter: string;
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onCoverLetterChange: (value: string) => void;
  onSubmit: (jobId: number) => void;
};

export function OpportunitiesApplyModal({
  modal,
  coverLetter,
  isSubmitting,
  error,
  onClose,
  onCoverLetterChange,
  onSubmit,
}: Props) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#111827]">Postular a oportunidad</p>
            <p className="truncate text-[12px] text-slate-500">
              {modal.title}
              {modal.companyName ? ` · ${modal.companyName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 transition-colors hover:text-slate-600"
            aria-label="Cerrar"
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
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}
          <label className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Mensaje para la empresa (opcional)
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => onCoverLetterChange(e.target.value)}
            disabled={isSubmitting}
            className="min-h-28 w-full resize-y rounded-xl border border-transparent bg-[#f3f5f8] px-4 py-3 text-sm outline-none transition-all focus:ring-2 focus:ring-[#294266]/20"
            placeholder="Cuéntales por qué encajas bien con esta oportunidad."
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/40 px-5 py-4">
          <Button type="button" variant="secondary" size="sm" disabled={isSubmitting} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={isSubmitting} onClick={() => onSubmit(modal.jobId)}>
            {isSubmitting ? "Enviando..." : "Postular"}
          </Button>
        </div>
      </div>
    </div>
  );
}

