import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';
import { verifyPassword } from '../utils/password.js';
import { signJwt } from '../middleware/auth.js';
import { getAvatar } from '../utils/avatar.js';

export const tokenRoutes = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

/**
 * GET /api/token - Get current user info
 */
tokenRoutes.get('/', async (c) => {
  const userInfo = c.get('userInfo');
  if (!userInfo) {
    return c.json({ errno: 1, errmsg: 'Unauthorized' }, 401);
  }

  return c.json({
    errno: 0,
    errmsg: '',
    data: {
      objectId: userInfo.objectId,
      display_name: userInfo.display_name,
      email: userInfo.email,
      type: userInfo.type,
      url: userInfo.url,
      avatar: userInfo.avatar || await getAvatar(userInfo.email),
      label: userInfo.label || '',
      mailMd5: await md5(userInfo.email.toLowerCase()),
    },
  });
});

/**
 * POST /api/token - Login
 */
tokenRoutes.post('/', async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ errno: 1, errmsg: 'email and password are required' }, 400);
  }

  const user = await c.env.DB.prepare(
    'SELECT * FROM wl_Users WHERE email = ?',
  )
    .bind(email)
    .first();

  if (!user) {
    return c.json({ errno: 1, errmsg: 'User not found' }, 404);
  }

  if ((user.type as string) === 'banned') {
    return c.json({ errno: 1, errmsg: 'Account is banned' }, 403);
  }

  const valid = await verifyPassword(password, user.password as string);
  if (!valid) {
    return c.json({ errno: 1, errmsg: 'Invalid password' }, 401);
  }

  // Check 2FA
  if (user['2fa'] && body.code === undefined) {
    return c.json({ errno: 1, errmsg: '2FA required', data: { '2fa': true } }, 401);
  }

  const jwtSecret = c.env.JWT_SECRET;
  if (!jwtSecret) {
    return c.json({ errno: 1, errmsg: 'JWT_SECRET not configured' }, 500);
  }

  const token = await signJwt({ id: user.id as number }, jwtSecret);

  return c.json({
    errno: 0,
    errmsg: '',
    data: {
      token,
      objectId: user.id,
      display_name: user.display_name,
      email: user.email,
      type: user.type,
      url: user.url || '',
      avatar: (user.avatar as string) || await getAvatar(user.email as string),
      label: user.label || '',
      mailMd5: await md5((user.email as string).toLowerCase()),
    },
  });
});

/**
 * DELETE /api/token - Logout
 */
tokenRoutes.delete('/', async (c) => {
  // JWT is stateless, client just discards the token
  return c.json({ errno: 0, errmsg: '' });
});

async function md5(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('MD5', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
