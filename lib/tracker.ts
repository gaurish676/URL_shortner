import { nanoid } from 'nanoid';
import getDb from './db';

export interface ClickMetadata {
  userAgent?: string | null;
  referer?: string | null;
}

export function recordClick(urlId: string, metadata: ClickMetadata): { success: boolean; clickId?: string } {
  try {
    const db = getDb();
    const id = nanoid();
    const timestamp = new Date().toISOString();

    db.prepare(`
      INSERT INTO clicks (id, url_id, timestamp, user_agent, referer)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      id,
      urlId,
      timestamp,
      metadata.userAgent || null,
      metadata.referer || null
    );

    return { success: true, clickId: id };
  } catch (err) {
    console.error('Failed to record click:', err);
    return { success: false };
  }
}
