// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      frontend/src/entities/session/model                     ║
// ║ Descripción: Tipos para sesión mock (roles y API del contexto).      ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Roles soportados por la sesión mock.
 */
export type SessionRole = "talento" | "empresa";

/**
 * Estado persistido de la sesión en el cliente.
 */
export type SessionState = {
  isAuthenticated: boolean;
  role: SessionRole | null;
  userName: string | null;
  companyName: string | null;
  onboardingCompleted: boolean;
};

/**
 * API expuesta por el contexto de sesión.
 */
export type SessionApi = SessionState & {
  loginTalent: (payload: { email: string }) => void;
  loginCompany: (payload: { companyName: string; email: string }) => void;
  completeOnboarding: () => void;
  logout: () => void;
};
