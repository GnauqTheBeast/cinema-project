import { Pool, PoolConfig } from 'pg';
import { logger } from '../../utils/logger';

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections?: number;
  idleTimeoutMillis?: number;
}

export class PostgresDB {
  private pool: Pool;

  constructor(config: PostgresConfig) {
    const poolConfig: PoolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.maxConnections || 100,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
    };

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle PostgreSQL client', err);
    });
  }

  getPool(): Pool {
    return this.pool;
  }

  async query(text: string, params?: any[]) {
    const start = Date.now();
    try {
      const res = await this.pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Error executing query', { text, error });
      throw error;
    }
  }

  async close() {
    await this.pool.end();
  }
}

export function createPostgresConnection(config: PostgresConfig): PostgresDB {
  return new PostgresDB(config);
}
