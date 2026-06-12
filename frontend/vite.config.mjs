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
        target: "http://127.0.0.1:11434",
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
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "src/main.tsx",
        "src/app/App.tsx",
        "src/app/router/ProtectedRoute.tsx",
        "src/app/router/index.tsx",
        "src/entities/ollama-session/index.ts",
        "src/entities/session/index.ts",
        "src/pages/chat/index.ts",
        "src/pages/cv-builder/index.ts",
        "src/pages/dashboard-company/index.ts",
        "src/pages/dashboard-user/index.ts",
        "src/pages/interview/index.ts",
        "src/pages/landing/index.ts",
        "src/pages/login-company/index.ts",
        "src/pages/login-portal/index.ts",
        "src/pages/login-user/index.ts",
        "src/pages/onboarding-user/index.ts",
        "src/pages/opportunities-user/index.ts",
        "src/pages/signup-company/index.ts",
        "src/pages/signup-talent/index.ts",
        "src/shared/config/routes.ts",
        "src/shared/lib/cn.ts",
        "src/shared/lib/storage.ts",
        "src/shared/ui/Button.tsx",
        "src/shared/ui/Checkbox.tsx",
        "src/shared/ui/Input.tsx",
        "src/shared/ui/Select.tsx",
        "src/shared/ui/index.ts",
      ],
    },
  },
};
