// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     cvRepository.ts                                         ║
// ║ Módulo:      backend/src/modules/cv                                  ║
// ║ Descripción: Repositorio de CVs (Oracle): CRUD por usuario.          ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Db } from "../../shared/db/postgreSQL";

import type { Cv } from "./types";

/**
 * Repositorio de CV.
 *
 * Nota: se asume que las validaciones de autorización (propietario)
 * se realizan en la capa de rutas/servicios.
 */
export class CvRepository {
  constructor(private readonly db: Db) {}

  /**
   * Lista CVs de un usuario.
   */
  async listByUser(userId: number): Promise<Cv[]> {
    const rows = await this.db.queryMany<any>(
      `SELECT id,
              user_id as "userId",
              title,
              content,
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM cvs
       WHERE user_id = :userId
       ORDER BY updated_at DESC`,
      { userId },
    );
    return rows as Cv[];
  }

  /**
   * Obtiene un CV por id.
   */
  async getById(id: number): Promise<Cv | null> {
    const row = await this.db.queryOne<any>(
      `SELECT id,
              user_id as "userId",
              title,
              content,
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM cvs
       WHERE id = :id`,
      { id },
    );
    return (row ?? null) as Cv | null;
  }

  /**
   * Crea un CV para el usuario y devuelve el registro persistido.
   */
  async create(userId: number, input: { title: string; content: string }): Promise<Cv> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO cvs (user_id, title, content)
       VALUES (:userId, :title, :content)
       RETURNING id, user_id as "userId", title, content, created_at as "createdAt", updated_at as "updatedAt"`,
      {
        userId,
        title: input.title,
        content: input.content,
      },
    );
    return row as Cv;
  }

  /**
   * Actualiza título y contenido de un CV.
   */
  async update(id: number, input: { title: string; content: string }): Promise<Cv | null> {
    await this.db.execute(
      `UPDATE cvs
       SET title = :title,
           content = :content,
           updated_at = NOW()
       WHERE id = :id`,
      { id, title: input.title, content: input.content },
    );
    return await this.getById(id);
  }

  /**
   * Elimina un CV por id.
   */
  async delete(id: number): Promise<void> {
    await this.db.execute(`DELETE FROM cvs WHERE id = :id`, { id });
  }
}
