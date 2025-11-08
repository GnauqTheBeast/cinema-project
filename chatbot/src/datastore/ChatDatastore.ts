import { Pool } from 'pg';
import { Chat, CHAT_TABLE } from '../models';

export class ChatDatastore {
  constructor(private pool: Pool) {}

  async createChatRecord(chat: Chat): Promise<void> {
    const query = `
      INSERT INTO ${CHAT_TABLE} (id, question, answer, embedding_question, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        answer = EXCLUDED.answer,
        embedding_question = EXCLUDED.embedding_question
    `;

    const values = [
      chat.id,
      chat.question,
      chat.answer,
      chat.embedding_question,
      chat.created_at || new Date(),
    ];

    try {
      await this.pool.query(query, values);
    } catch (error) {
      throw new Error(`Failed to insert chat record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getChatByHash(questionHash: string): Promise<Chat | null> {
    const query = `SELECT * FROM ${CHAT_TABLE} WHERE id = $1`;

    try {
      const result = await this.pool.query(query, [questionHash]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0] as Chat;
    } catch (error) {
      throw new Error(`Failed to get chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentChatRecordsWithEmbedding(limit: number): Promise<Chat[]> {
    const query = `
      SELECT * FROM ${CHAT_TABLE}
      WHERE embedding_question IS NOT NULL AND embedding_question != ''
      ORDER BY created_at DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);
      return result.rows as Chat[];
    } catch (error) {
      throw new Error(`Failed to get recent chat records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
