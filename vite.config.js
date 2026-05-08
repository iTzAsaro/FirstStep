// ╔══════════════════════════════════════════════════════════╗
// ║ Archivo:     vite.config.js                              ║
// ║ Módulo:      BuildConfig                                 ║
// ║ Descripción: Configuración de Vite con aliases para FSD.  ║
// ║ Creado:      04-05-2026                                  ║
// ╚══════════════════════════════════════════════════════════╝

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app": path.resolve(process.cwd(), "src/app"),
      "@pages": path.resolve(process.cwd(), "src/pages"),
      "@widgets": path.resolve(process.cwd(), "src/widgets"),
      "@features": path.resolve(process.cwd(), "src/features"),
      "@processes": path.resolve(process.cwd(), "src/processes"),
      "@entities": path.resolve(process.cwd(), "src/entities"),
      "@shared": path.resolve(process.cwd(), "src/shared")
    }
  }
})
