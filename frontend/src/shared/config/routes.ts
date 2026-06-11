// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     routes.ts                                               ║
// ║ Módulo:      frontend/src/shared/config                              ║
// ║ Descripción: Rutas centralizadas de la SPA para navegación.           ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Mapa de rutas (paths) de la aplicación.
 *
 * Se usa para:
 * - Links/navegación
 * - Definición de rutas en AppRouter
 */
export const routes = {
  home: "/",
  portal: "/portal",
  login: "/login",
  talentSignUp: "/talento/registro",
  companyLogin: "/empresa/login",
  companySignUp: "/empresa/registro",
  companyOnboarding: "/empresa/onboarding",
  companyDashboard: "/empresa/dashboard",
  cvBuilder: "/cv",
  chat: "/chat",
  messages: "/mensajes",
  interview: "/entrevista",
  onboarding: "/onboarding",
  dashboard: "/dashboard",
  opportunities: "/oportunidades",
} as const;
