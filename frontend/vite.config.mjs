// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     vite.config.mjs                                         ║
// ║ Módulo:      frontend                                                ║
// ║ Descripción: Configuración de Vite (React, alias y proxy a Ollama).  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/ollama": {
        target: "http://localhost:11434",
        changeOrigin: true,
        timeout: 600_000,
        proxyTimeout: 600_000,
        rewrite: (pathStr) => pathStr.replace(/^\/ollama/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
};
