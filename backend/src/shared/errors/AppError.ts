// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     AppError.ts                                             ║
// ║ Módulo:      backend/src/shared/errors                               ║
// ║ Descripción: Error de dominio con status HTTP y código semántico.    ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

/**
 * Error de aplicación con datos para respuesta HTTP.
 *
 * Se utiliza para estandarizar errores (status + code + message)
 * desde servicios/rutas hacia el middleware de errores.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(params: { status: number; code: string; message: string }) {
    super(params.message);
    this.status = params.status;
    this.code = params.code;
  }
}

/**
 * Type guard para identificar AppError.
 */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
