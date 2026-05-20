// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     oracledb.d.ts                                           ║
// ║ Módulo:      backend/src/types                                       ║
// ║ Descripción: Tipado mínimo de oracledb para compilar en este repo.   ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

declare module "oracledb" {
  const oracledb: any;

  export type Pool = any;
  export type Result<T = any> = any;
  export type BindParameters = any;
  export type ExecuteOptions = any;

  export const OUT_FORMAT_OBJECT: any;
  export const BIND_OUT: any;
  export const NUMBER: any;

  export default oracledb;
}
