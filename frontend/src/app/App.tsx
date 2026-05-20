// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     App.tsx                                                 ║
// ║ Módulo:      frontend/src/app                                        ║
// ║ Descripción: Componente raíz que compone providers + router.         ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import { AppProviders } from "@/app/providers";
import { AppRouter } from "@/app/router";

/**
 * Componente raíz de la aplicación.
 */
export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
