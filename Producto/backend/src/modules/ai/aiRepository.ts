// ╔══════════════════════════════════════════════════════════════════════╗
// ║ Archivo:     aiRepository.ts                                         ║
// ║ Módulo:      backend/src/modules/ai                                  ║
// ║ Descripción: Repositorio AI: sesiones y mensajes (Oracle).           ║
// ║ Creado:      20-05-2026                                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

import type { Db } from "../../shared/db/postgreSQL";

import type { AiMessage, AiMessageRole, AiSession, AiSessionKind, InterviewDifficulty, InterviewType } from "./types";

/**
 * Repositorio de persistencia para módulos de IA.
 *
 * Guarda:
 * - Sesiones (general / interview)
 * - Mensajes asociados a una sesión
 */
export class AiRepository {
  constructor(private readonly db: Db) {}

  /**
   * Lista sesiones del usuario, opcionalmente filtrando por tipo.
   */
  async listSessions(userId: number, kind?: AiSessionKind): Promise<AiSession[]> {
    const where = kind ? "AND kind = :kind" : "";
    const rows = await this.db.queryMany<any>(
      `SELECT id,
              user_id as "userId",
              kind,
              title,
              model,
              interview_role as "interviewRole",
              interview_type as "interviewType",
              interview_difficulty as "interviewDifficulty",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM ai_sessions
       WHERE user_id = :userId ${where}
       ORDER BY updated_at DESC`,
      kind ? { userId, kind } : { userId },
    );
    return rows as AiSession[];
  }

  /**
   * Obtiene una sesión por id.
   */
  async getSession(id: number): Promise<AiSession | null> {
    const row = await this.db.queryOne(
      `SELECT id,
              user_id as "userId",
              kind,
              title,
              model,
              interview_role as "interviewRole",
              interview_type as "interviewType",
              interview_difficulty as "interviewDifficulty",
              created_at as "createdAt",
              updated_at as "updatedAt"
       FROM ai_sessions
       WHERE id = :id`,
      { id },
    );
    return (row ?? null) as AiSession | null;
  }

  /**
   * Crea una nueva sesión AI.
   * Para entrevistas se guardan los settings (puesto/tipo/dificultad).
   */
  async createSession(input: {
    userId: number;
    kind: AiSessionKind;
    title: string;
    model: string;
    interviewRole?: string | null;
    interviewType?: InterviewType | null;
    interviewDifficulty?: InterviewDifficulty | null;
  }): Promise<AiSession> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO ai_sessions (user_id, kind, title, model, interview_role, interview_type, interview_difficulty)
       VALUES (:userId, :kind, :title, :model, :interviewRole, :interviewType, :interviewDifficulty)
       RETURNING id,
                 user_id as "userId",
                 kind,
                 title,
                 model,
                 interview_role as "interviewRole",
                 interview_type as "interviewType",
                 interview_difficulty as "interviewDifficulty",
                 created_at as "createdAt",
                 updated_at as "updatedAt"`,
      {
        userId: input.userId,
        kind: input.kind,
        title: input.title,
        model: input.model,
        interviewRole: input.interviewRole ?? null,
        interviewType: input.interviewType ?? null,
        interviewDifficulty: input.interviewDifficulty ?? null,
      },
    );
    return row as AiSession;
  }

  /**
   * Actualiza metadata de la sesión (título y updated_at).
   */
  async touchSession(id: number, title?: string | null) {
    await this.db.execute(
      `UPDATE ai_sessions
       SET title = COALESCE(:title, title),
           updated_at = NOW()
       WHERE id = :id`,
      { id, title: title ?? null },
    );
  }

  /**
   * Elimina una sesión (y por cascada sus mensajes).
   */
  async deleteSession(id: number) {
    await this.db.execute(`DELETE FROM ai_sessions WHERE id = :id`, { id });
  }

  /**
   * Lista mensajes de una sesión en orden de creación.
   */
  async listMessages(sessionId: number): Promise<AiMessage[]> {
    const rows = await this.db.queryMany<any>(
      `SELECT id,
              session_id as "sessionId",
              role,
              content,
              created_at as "createdAt"
       FROM ai_messages
       WHERE session_id = :sessionId
       ORDER BY id ASC`,
      { sessionId },
    );
    return rows as AiMessage[];
  }

  /**
   * Agrega un mensaje a una sesión y toca la sesión (updated_at).
   */
  async addMessage(sessionId: number, role: AiMessageRole, content: string): Promise<AiMessage> {
    const row = await this.db.queryOne<any>(
      `INSERT INTO ai_messages (session_id, role, content)
       VALUES (:sessionId, :role, :content)
       RETURNING id, session_id as "sessionId", role, content, created_at as "createdAt"`,
      {
        sessionId,
        role,
        content,
      },
    );
    await this.touchSession(sessionId, null);
    return row as AiMessage;
  }

  /**
   * Borra mensajes de la sesión.
   * Si keepSystem=true, conserva el mensaje role='system' y borra el resto.
   */
  async resetMessages(sessionId: number, keepSystem: boolean) {
    if (keepSystem) {
      await this.db.execute(`DELETE FROM ai_messages WHERE session_id = :sessionId AND role <> 'system'`, { sessionId });
    } else {
      await this.db.execute(`DELETE FROM ai_messages WHERE session_id = :sessionId`, { sessionId });
    }
    await this.touchSession(sessionId, null);
  }
}
