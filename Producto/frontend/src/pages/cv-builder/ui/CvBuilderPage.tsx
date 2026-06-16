// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     CvBuilderPage.tsx                                       ║
// ║ Módulo:      frontend/src/pages/cv-builder/ui                       ║
// ║ Descripción: Página del Constructor de CV AI (temporalmente en       ║
// ║              mantenimiento mientras se ajusta la infraestructura de  ║
// ║              IA local con Ollama).                                   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { MaintenanceNotice } from "@/shared/ui";

/**
 * Vista de mantenimiento para el Constructor de CV AI.
 */
export function CvBuilderPage() {
  return (
    <MaintenanceNotice
      eyebrow="CAREER CO-PILOT"
      title="Currículum AI en mantenimiento"
      description="Estamos ajustando nuestro asistente de IA para construir tu CV. Vuelve a intentarlo más tarde."
    />
  );
}
