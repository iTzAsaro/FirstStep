// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     types.ts                                                ║
// ║ Módulo:      backend/src/modules/cv                                  ║
// ║ Descripción: Tipos de dominio para CV (Currículum).                  ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * CV persistido (contenido en formato texto/JSON serializado según UI).
 */
export type Cv = {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};
