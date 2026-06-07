import { describe, it, expect, beforeAll } from 'vitest';
import { env, SELF } from 'cloudflare:test';
import { setupDB } from '../helpers/setup.js';

const BASE = 'http://localhost';

beforeAll(async () => {
  await setupDB((env as any).DB);
});

describe('POST /api/user — registration', () => {
  it('registers the first user and assigns administrator type', async () => {
    const res = await SELF.fetch(`${BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: 'Admin User',
        email: 'admin@example.com',
        password: 'adminpass123',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.errno).toBe(0);
    expect(data.data.type).toBe('administrator');
    expect(data.data.display_name).toBe('Admin User');
  });

  it('assigns guest type to subsequent users', async () => {
    const res = await SELF.fetch(`${BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        display_name: 'Alice',
        email: 'alice@example.com',
        password: 'alicepass123',
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.data.type).toBe('guest');
  });

  it('rejects duplicate email with 409', async () => {
    const res = await SELF.fetch(`${BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alice@example.com',
        password: 'anotherpass',
      }),
    });
    expect(res.status).toBe(409);
    const data = await res.json() as any;
    expect(data.errno).toBe(1);
  });

  it('requires email and password', async () => {
    const res = await SELF.fetch(`${BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: 'NoEmail' }),
    });
    expect(res.status).toBe(400);
  });

  it('uses email prefix as display_name when not provided', async () => {
    const res = await SELF.fetch(`${BASE}/api/user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'bob@example.com',
        password: 'bobpass123',
      }),
    });
    const data = await res.json() as any;
    expect(data.data.display_name).toBe('bob');
  });
});

describe('GET /api/user — public list', () => {
  it('returns top commenters list', async () => {
    const res = await SELF.fetch(`${BASE}/api/user`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.errno).toBe(0);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
