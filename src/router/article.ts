import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';

export const articleRoutes = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

/**
 * GET /api/article
 * Get article view counter(s)
 */
articleRoutes.get('/', async (c) => {
  const url = c.req.query('url');
  if (!url) {
    return c.json({ errno: 1, errmsg: 'url is required' }, 400);
  }

  const urls = url.split(',');
  if (urls.length === 1) {
    const result = await c.env.DB.prepare(
      'SELECT * FROM wl_Counter WHERE url = ?',
    )
      .bind(urls[0])
      .first();

    return c.json({
      errno: 0,
      errmsg: '',
      data: result ? formatCounter(result) : { time: 0 },
    });
  }

  const placeholders = urls.map(() => '?').join(',');
  const result = await c.env.DB.prepare(
    `SELECT * FROM wl_Counter WHERE url IN (${placeholders})`,
  )
    .bind(...urls)
    .all();

  const counterMap = Object.fromEntries(
    result.results.map((r: any) => [r.url, formatCounter(r)]),
  );

  return c.json({
    errno: 0,
    errmsg: '',
    data: urls.map((u) => counterMap[u] || { time: 0 }),
  });
});

/**
 * POST /api/article
 * Update article view counter
 */
articleRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { url, action } = body;

  if (!url) {
    return c.json({ errno: 1, errmsg: 'url is required' }, 400);
  }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM wl_Counter WHERE url = ?',
  )
    .bind(url)
    .first();

  if (!existing) {
    await c.env.DB.prepare(
      'INSERT INTO wl_Counter (url, time) VALUES (?, 1)',
    )
      .bind(url)
      .run();
  } else if (action === 'reaction') {
    // Handle reaction updates
    const reactionIndex = body.reactionIndex;
    if (reactionIndex >= 0 && reactionIndex <= 8) {
      const field = `reaction${reactionIndex}`;
      await c.env.DB.prepare(
        `UPDATE wl_Counter SET ${field} = ${field} + 1, updatedAt = datetime('now') WHERE url = ?`,
      )
        .bind(url)
        .run();
    }
  } else {
    // Increment view count
    await c.env.DB.prepare(
      "UPDATE wl_Counter SET time = time + 1, updatedAt = datetime('now') WHERE url = ?",
    )
      .bind(url)
      .run();
  }

  const result = await c.env.DB.prepare(
    'SELECT * FROM wl_Counter WHERE url = ?',
  )
    .bind(url)
    .first();

  return c.json({
    errno: 0,
    errmsg: '',
    data: formatCounter(result),
  });
});

function formatCounter(row: any) {
  if (!row) return { time: 0 };
  return {
    objectId: row.id,
    time: row.time || 0,
    url: row.url,
    reaction0: row.reaction0 || 0,
    reaction1: row.reaction1 || 0,
    reaction2: row.reaction2 || 0,
    reaction3: row.reaction3 || 0,
    reaction4: row.reaction4 || 0,
    reaction5: row.reaction5 || 0,
    reaction6: row.reaction6 || 0,
    reaction7: row.reaction7 || 0,
    reaction8: row.reaction8 || 0,
  };
}
