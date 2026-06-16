// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     index.ts                                                ║
// ║ Módulo:      frontend/src/entities/session                           ║
// ║ Descripción: Barrel export de sesión (provider, hook y tipos).       ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

export type { SessionRole } from "@/entities/session/model/types";
export { SessionProvider, useSession } from "@/entities/session/model/session";
