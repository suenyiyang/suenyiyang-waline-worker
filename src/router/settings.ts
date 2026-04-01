import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';

export const settingsRoutes = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

const ALLOWED_KEYS = new Set([
  'waline_client_version',
  'comment_default_status',
  'user_comment_default_status',
  'worker_display',
  'llm_mode',
  'llm_skip_admin',
  'llm_endpoint',
  'llm_api_key',
  'llm_model',
  'llm_prompt',
]);

/**
 * GET /api/settings - Get all settings (admin only)
 */
settingsRoutes.get('/', async (c) => {
  const userInfo = c.get('userInfo');
  if (userInfo?.type !== 'administrator') {
    return c.json({ errno: 1, errmsg: 'Unauthorized' }, 403);
  }

  const result = await c.env.DB.prepare(
    'SELECT key, value FROM wl_Settings',
  ).all();

  // Sensitive keys that must be masked in API responses
  const MASKED_KEYS = new Set(['llm_api_key']);

  const settings: Record<string, string> = {};
  for (const row of result.results) {
    const key = row.key as string;
    const value = row.value as string;
    if (MASKED_KEYS.has(key) && value) {
      // Show only first 3 and last 4 chars: "sk-****xxxx"
      settings[key] = value.length > 7
        ? value.slice(0, 3) + '****' + value.slice(-4)
        : '****';
    } else {
      settings[key] = value;
    }
  }

  return c.json({ errno: 0, errmsg: '', data: settings });
});

/**
 * PUT /api/settings - Update settings (admin only)
 * Body: { key: value, ... }
 */
settingsRoutes.put('/', async (c) => {
  const userInfo = c.get('userInfo');
  if (userInfo?.type !== 'administrator') {
    return c.json({ errno: 1, errmsg: 'Unauthorized' }, 403);
  }

  const body = await c.req.json();
  const stmts: D1PreparedStatement[] = [];

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    stmts.push(
      c.env.DB.prepare(
        `INSERT INTO wl_Settings (key, value, updatedAt) VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
      ).bind(key, String(value)),
    );
  }

  if (stmts.length > 0) {
    await c.env.DB.batch(stmts);
  }

  return c.json({ errno: 0, errmsg: '' });
});

/**
 * Helper: Get a single setting value
 */
export async function getSetting(db: D1Database, key: string): Promise<string | null> {
  const row = await db.prepare(
    'SELECT value FROM wl_Settings WHERE key = ?',
  ).bind(key).first();
  return row ? (row.value as string) : null;
}

/**
 * Helper: Get multiple settings at once
 */
export async function getSettings(db: D1Database, keys: string[]): Promise<Record<string, string>> {
  const placeholders = keys.map(() => '?').join(',');
  const result = await db.prepare(
    `SELECT key, value FROM wl_Settings WHERE key IN (${placeholders})`,
  ).bind(...keys).all();

  const settings: Record<string, string> = {};
  for (const row of result.results) {
    settings[row.key as string] = row.value as string;
  }
  return settings;
}
