import { nanoid, customAlphabet } from 'nanoid';
import getDb from './db';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const generateShortCode = customAlphabet(ALPHABET, 6);

export const RESERVED_SLUGS = new Set([
  'api',
  '_next',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
  'analytics',
  'dashboard',
  'static',
  'data',
]);

export function isReservedSlug(slug: string): boolean {
  if (!slug) return true;
  const lower = slug.toLowerCase();
  return RESERVED_SLUGS.has(lower) || lower.startsWith('_') || lower.startsWith('.');
}

export interface UrlRecord {
  id: string;
  code: string;
  original_url: string;
  created_at: string;
}

export function normalizeAndValidateUrl(
  rawUrl: string,
  hostHeader?: string | null
): { valid: boolean; normalizedUrl?: string; error?: string } {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required' };
  }

  let trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { valid: false, error: 'URL exceeds maximum length of 2048 characters' };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http and https protocols are supported' };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      // Allow valid IP addresses
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname)) {
        return { valid: false, error: 'Invalid hostname format' };
      }
    }

    const hostLower = parsed.hostname.toLowerCase();
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
    if (blockedHosts.includes(hostLower)) {
      return { valid: false, error: 'Shortening URLs pointing back to this service is not allowed' };
    }

    // Prevent loopback to own host from header
    if (hostHeader) {
      const cleanHost = hostHeader.split(':')[0].toLowerCase();
      if (hostLower === cleanHost) {
        return { valid: false, error: 'Shortening URLs pointing back to this service is not allowed' };
      }
    }

    return { valid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function createOrGetShortUrl(originalUrl: string): { urlRecord: UrlRecord; isExisting: boolean } {
  const db = getDb();

  // Check if URL already shortened
  const existing = db
    .prepare<[string], UrlRecord>('SELECT * FROM urls WHERE original_url = ? LIMIT 1')
    .get(originalUrl);
  if (existing) {
    return { urlRecord: existing, isExisting: true };
  }

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateShortCode();
    if (isReservedSlug(code)) continue;

    const id = nanoid();
    const createdAt = new Date().toISOString();

    try {
      db.prepare(`
        INSERT INTO urls (id, code, original_url, created_at)
        VALUES (?, ?, ?, ?)
      `).run(id, code, originalUrl, createdAt);

      const record: UrlRecord = {
        id,
        code,
        original_url: originalUrl,
        created_at: createdAt,
      };

      return { urlRecord: record, isExisting: false };
    } catch (err: unknown) {
      const sqliteErr = err as { code?: string };
      if (sqliteErr?.code === 'SQLITE_CONSTRAINT_UNIQUE' || sqliteErr?.code === 'SQLITE_CONSTRAINT') {
        continue;
      }
      throw err;
    }
  }

  throw new Error('Failed to generate a unique short code. Please try again.');
}

export function getUrlByCode(code: string): UrlRecord | undefined {
  if (isReservedSlug(code)) return undefined;
  const db = getDb();
  return db.prepare<[string], UrlRecord>('SELECT * FROM urls WHERE code = ? LIMIT 1').get(code);
}
