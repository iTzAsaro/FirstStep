import { AppTitle } from "@shared/ui"

/**
 * Muestra la pantalla principal de ejemplo para validar FSD.
 * @returns {import("react").JSX.Element} Vista de inicio
 */
export function HomePage() {
  return (
    <main className="space-y-4">
      <AppTitle text="Frontend iniciado (React + Vite + TS + Tailwind) con FSD" />
      <p className="max-w-2xl text-slate-700">
        Esta base usa Feature-Sliced Design para separar capas y escalar el
        proyecto sin mezclar responsabilidades.
      </p>
    </main>
  )
}
