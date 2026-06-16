// ╔═══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     InterviewPage.tsx                                        ║
// ║ Módulo:      frontend/src/pages/interview/ui                          ║
// ║ Descripción: Simulador de entrevistas (temporalmente en mantenimiento ║
// ║              mientras se ajusta la infraestructura de IA local con   ║
// ║              Ollama).                                                  ║
// ║ Creado:      20-05-2026                                               ║
// ╚═══════════════════════════════════════════════════════════════════════╝

import { MaintenanceNotice } from "@/shared/ui";

/**
 * Vista de mantenimiento para el Simulador de entrevistas con IA.
 */
export function InterviewPage() {
  return (
    <MaintenanceNotice
      eyebrow="ENTREVISTAS IA"
      title="Simulador de entrevistas en mantenimiento"
      description="Estamos ajustando nuestro asistente de IA para simular entrevistas. Vuelve a intentarlo más tarde."
    />
  );
}
