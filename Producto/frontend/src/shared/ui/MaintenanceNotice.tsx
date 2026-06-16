// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     MaintenanceNotice.tsx                                   ║
// ║ Módulo:      frontend/src/shared/ui                                  ║
// ║ Descripción: Componente genérico de aviso de mantenimiento/pausa.    ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

type MaintenanceNoticeProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

/**
 * Pantalla de placeholder para funcionalidades en mantenimiento o deshabilitadas.
 */
export function MaintenanceNotice({ eyebrow, title, description }: MaintenanceNoticeProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#eef4fb_0%,#f8fafc_100%)] px-6">
      <div className="max-w-md text-center">
        {eyebrow && (
          <span className="inline-flex rounded-full border border-[#dde7f5] bg-[#f7faff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5d7ba6]">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#1e3456]">{title}</h1>
        {description && (
          <p className="mt-4 text-sm leading-7 text-slate-500">{description}</p>
        )}
      </div>
    </div>
  );
}
