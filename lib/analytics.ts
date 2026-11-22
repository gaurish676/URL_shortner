import getDb from './db';
import { UrlRecord } from './shortener';

export interface UrlSummaryStats extends UrlRecord {
  total_clicks: number;
  last_clicked: string | null;
}

export interface ClickRecord {
  id: string;
  timestamp: string;
  user_agent: string | null;
  referer: string | null;
}

export interface UrlDetailedAnalytics {
  id: string;
  code: string;
  original_url: string;
  created_at: string;
  totalClicks: number;
  clicks: ClickRecord[];
}

export function getAllUrlsWithStats(): UrlSummaryStats[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT 
      u.id, 
      u.code, 
      u.original_url, 
      u.created_at, 
      COUNT(c.id) AS total_clicks,
      MAX(c.timestamp) AS last_clicked
    FROM urls u
    LEFT JOIN clicks c ON u.id = c.url_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all() as UrlSummaryStats[];

  return rows;
}

export function getUrlDetailedAnalytics(code: string): UrlDetailedAnalytics | null {
  const db = getDb();
  const url = db.prepare<[string], UrlRecord>(`
    SELECT id, code, original_url, created_at 
    FROM urls 
    WHERE code = ? 
    LIMIT 1
  `).get(code);

  if (!url) {
    return null;
  }

  const clicks = db.prepare<[string], ClickRecord>(`
    SELECT id, timestamp, user_agent, referer 
    FROM clicks 
    WHERE url_id = ? 
    ORDER BY timestamp DESC
  `).all(url.id) as ClickRecord[];

  return {
    id: url.id,
    code: url.code,
    original_url: url.original_url,
    created_at: url.created_at,
    totalClicks: clicks.length,
    clicks,
  };
}
