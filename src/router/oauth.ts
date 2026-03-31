import { Hono } from 'hono';
import type { Env, Variables } from '../env.js';
import { signJwt } from '../middleware/auth.js';
import { getAvatar } from '../utils/avatar.js';

export const oauthRoutes = new Hono<{
  Bindings: Env;
  Variables: Variables;
}>();

const DEFAULT_OAUTH_URL = 'https://oauth.lithub.cc';

/**
 * GET /api/oauth - OAuth login flow
 *
 * Step 1 (no code): Redirect user to external OAuth provider
 * Step 2 (with code): Exchange code for user info, create/link user, issue JWT
 */
oauthRoutes.get('/', async (c) => {
  const type = c.req.query('type');
  const code = c.req.query('code');
  const state = c.req.query('state');
  const redirect = c.req.query('redirect') || '/ui';
  const oauthUrl = c.env.OAUTH_URL || DEFAULT_OAUTH_URL;

  if (!type) {
    return c.json({ errno: 1, errmsg: 'type is required' }, 400);
  }

  // Step 1: No code → redirect to OAuth provider
  if (!code) {
    const callbackUrl = new URL(c.req.url);
    callbackUrl.search = '';
    callbackUrl.searchParams.set('type', type);
    callbackUrl.searchParams.set('redirect', redirect);

    const loginUrl = `${oauthUrl}/${type}/login?redirect=${encodeURIComponent(callbackUrl.toString())}&state=${encodeURIComponent(redirect)}`;
    return c.redirect(loginUrl);
  }

  // Step 2: Have code → exchange for user info
  try {
    const userInfoUrl = `${oauthUrl}/${type}/callback?code=${encodeURIComponent(code)}${state ? '&state=' + encodeURIComponent(state) : ''}`;
    const resp = await fetch(userInfoUrl, {
      headers: { 'User-Agent': 'Waline-On-Worker/1.0' },
    });

    if (!resp.ok) {
      return c.redirect(`${redirect}?error=oauth_failed`);
    }

    const oauthUser = await resp.json() as Record<string, any>;
    const socialId = String(oauthUser.id || oauthUser.login || oauthUser.name || '');
    const socialName = String(oauthUser.name || oauthUser.login || oauthUser.display_name || '');
    const socialEmail = String(oauthUser.email || '');
    const socialAvatar = String(oauthUser.avatar_url || oauthUser.avatar || '');
    const socialUrl = String(oauthUser.html_url || oauthUser.url || oauthUser.blog || '');

    if (!socialId) {
      return c.redirect(`${redirect}?error=oauth_no_id`);
    }

    // Try to find existing user by social link
    const socialField = getSocialField(type);
    let user: Record<string, unknown> | null = null;

    if (socialField) {
      user = await c.env.DB.prepare(
        `SELECT * FROM wl_Users WHERE ${socialField} = ?`,
      ).bind(socialId).first();
    }

    // If not found by social, try by email
    if (!user && socialEmail) {
      user = await c.env.DB.prepare(
        'SELECT * FROM wl_Users WHERE email = ?',
      ).bind(socialEmail).first();

      // Link social account
      if (user && socialField) {
        await c.env.DB.prepare(
          `UPDATE wl_Users SET ${socialField} = ?, updatedAt = datetime('now') WHERE id = ?`,
        ).bind(socialId, user.id).run();
      }
    }

    // Create new user if not found
    if (!user) {
      const userCount = await c.env.DB.prepare(
        'SELECT COUNT(*) as count FROM wl_Users',
      ).first();
      const isFirst = ((userCount?.count as number) || 0) === 0;

      const email = socialEmail || `${type}_${socialId}@oauth.local`;

      await c.env.DB.prepare(
        `INSERT INTO wl_Users (display_name, email, password, type, url, avatar, ${socialField || 'github'})
         VALUES (?, ?, '', ?, ?, ?, ?)`,
      ).bind(
        socialName || socialId,
        email,
        isFirst ? 'administrator' : 'guest',
        socialUrl,
        socialAvatar,
        socialId,
      ).run();

      user = await c.env.DB.prepare(
        'SELECT * FROM wl_Users WHERE email = ?',
      ).bind(email).first();
    }

    if (!user) {
      return c.redirect(`${redirect}?error=oauth_create_failed`);
    }

    if ((user.type as string) === 'banned') {
      return c.redirect(`${redirect}?error=account_banned`);
    }

    // Issue JWT
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.redirect(`${redirect}?error=server_error`);
    }

    const token = await signJwt({ id: user.id as number }, jwtSecret);
    const avatar = (user.avatar as string) || await getAvatar((user.email as string) || '');

    // Build redirect URL with token info
    const finalRedirect = state || redirect;
    const sep = finalRedirect.includes('?') ? '&' : '?';
    const tokenData = JSON.stringify({
      token,
      email: user.email,
      display_name: user.display_name,
      type: user.type,
      avatar,
      objectId: user.id,
      [type]: socialId,
    });

    return c.redirect(`${finalRedirect}${sep}token=${encodeURIComponent(tokenData)}`);
  } catch {
    return c.redirect(`${redirect}?error=oauth_error`);
  }
});

function getSocialField(type: string): string | null {
  const map: Record<string, string> = {
    github: 'github',
    twitter: 'twitter',
    facebook: 'facebook',
    google: 'google',
    weibo: 'weibo',
    qq: 'qq',
  };
  return map[type] || null;
}
