import { Injectable, Logger } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { config } from '../config/app.config';

@Injectable()
export class DatabaseService {
  private readonly pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    try {
      this.pool = new Pool({
        connectionString: `${config.dbConfig.DATABASE_URL}`,
      });
      this.logger.log('database connected');
    } catch (error) {
      this.logger.error('cannot connect to database', error);
    }
  }

  async findThreadIdByPsIdAndPageId(
    psId: string,
    pageId: string,
  ): Promise<string> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
      const results = await client.query(
        'SELECT thread_id FROM facebook_page_user_thread WHERE page_scoped_id = $1 AND page_id = $2',
        [psId, pageId],
      );
      if (!results.rows.length) {
        return null;
      }
      return results.rows[0].thread_id;
    } catch (error) {
      this.logger.error('error getting thread_id', error);
    } finally {
      client?.release();
    }
  }

  async saveThreadId(
    threadId: string,
    psId: string,
    pageId: string,
  ): Promise<void> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
      await client.query(
        'INSERT INTO facebook_page_user_thread (page_id, page_scoped_id ,thread_id) VALUES ($1, $2, $3) ON CONFLICT (page_scoped_id, page_id) DO UPDATE SET thread_id = EXCLUDED.thread_id',
        [pageId, psId, threadId],
      );
      this.logger.log('thread_id saved');
    } catch (error) {
      this.logger.error('Error saving thread ID:', error.message);
    } finally {
      client?.release();
    }
  }

  async findOpenAIIdByPageId(pageId: string): Promise<string> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
      const results = await client.query(
        'SELECT chat_bot.openai_id from chat_bot JOIN facebook_page ON chat_bot.chat_bot_id = facebook_page.chatbot_id AND facebook_page.facebook_page_id = $1 AND chat_bot.is_active = true',
        [pageId],
      );
      if (!results.rows.length) {
        return null;
      }
      return results.rows[0].openai_id;
    } catch (error) {
      this.logger.error('Error fetching assistant_id:', error.message);
    } finally {
      client?.release();
    }
  }

  async findPageAccessTokenByPageId(pageId: string): Promise<string> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
      const results = await client.query(
        'SELECT page_access_token from facebook_page WHERE facebook_page_id = $1',
        [pageId],
      );
      if (!results.rows.length) {
        return null;
      }
      return results.rows[0].page_access_token;
    } catch (error) {
      this.logger.error('Error fetching page_access_token:', error.message);
    } finally {
      client?.release();
    }
  }
}
