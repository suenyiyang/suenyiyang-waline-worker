import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { setupDB } from '../helpers/setup.js';
import { hashPassword } from '../../src/utils/password.js';

const BASE = 'http://localhost';

beforeAll(async () => {
  const db = (env as any).DB as D1Database;
  await setupDB(db);
  const hash = await hashPassword('testpass123');
  await db.prepare(
    'INSERT INTO wl_Users (display_name, email, password, type) VALUES (?, ?, ?, ?)',
  ).bind('Test User', 'test@example.com', hash, 'administrator').run();
});

describe('POST /api/token — login', () => {
  it('returns a token on valid credentials', async () => {
    const res = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'testpass123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.errno).toBe(0);
    expect(typeof data.data.token).toBe('string');
    expect(data.data.token.length).toBeGreaterThan(0);
  });

  it('returns 401 for wrong password', async () => {
    const res = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
    });
    expect(res.status).toBe(401);
    const data = await res.json() as any;
    expect(data.errno).toBe(1);
  });

  it('returns 401 for unknown email', async () => {
    const res = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'pass' }),
    });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/token — current user', () => {
  it('returns user info for a valid token', async () => {
    // Login to get a real token
    const loginRes = await SELF.fetch(`${BASE}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'testpass123' }),
    });
    const { data: { token } } = await loginRes.json() as any;

    const res = await SELF.fetch(`${BASE}/api/token`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.errno).toBe(0);
    expect(data.data.email).toBe('test@example.com');
    expect(data.data.type).toBe('administrator');
  });

  it('returns 401 without a token', async () => {
    const res = await SELF.fetch(`${BASE}/api/token`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await SELF.fetch(`${BASE}/api/token`, {
      headers: { 'Authorization': 'Bearer not.a.valid.token' },
    });
    expect(res.status).toBe(401);
  });
});
