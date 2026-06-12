// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     ChatPage.tsx                                            ║
// ║ Módulo:      frontend/src/pages/chat/ui                              ║
// ║ Descripción: Chat general (temporalmente en mantenimiento mientras   ║
// ║              se ajusta la infraestructura de IA local con Ollama).   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { MaintenanceNotice } from "@/shared/ui";

/**
 * Vista de mantenimiento para el Chat general con IA.
 */
export function ChatPage() {
  return (
    <MaintenanceNotice
      eyebrow="CHAT IA"
      title="Chat IA en mantenimiento"
      description="Estamos ajustando nuestro asistente de IA. Vuelve a intentarlo más tarde."
    />
  );
}
