import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Variables } from './env.js';
import { auth } from './middleware/auth.js';
import { commentRoutes } from './router/comment.js';
import { articleRoutes } from './router/article.js';
import { userRoutes } from './router/user.js';
import { tokenRoutes } from './router/token.js';
import { settingsRoutes } from './router/settings.js';
import { oauthRoutes } from './router/oauth.js';
import { getWalinePage } from './ui/waline-page.js';
import { getAdminPage } from './ui/admin-panel.js';

const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// CORS
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const secureDomains = c.env.SECURE_DOMAINS;
      if (!secureDomains) return origin;
      const allowed = secureDomains.split(',').map((d: string) => d.trim());
      if (allowed.some((d: string) => origin === d || origin.endsWith(`.${d}`))) {
        return origin;
      }
      return '';
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    credentials: true,
  }),
);

// Auth middleware - parse JWT on all /api routes (non-blocking)
app.use('/api/*', auth);

// Routes
app.route('/api/comment', commentRoutes);
app.route('/api/article', articleRoutes);
app.route('/api/user', userRoutes);
app.route('/api/token', tokenRoutes);
app.route('/api/settings', settingsRoutes);
app.route('/api/oauth', oauthRoutes);

// Admin panel UI
app.get('/ui', (c) => {
  return c.html(getAdminPage());
});
app.get('/ui/*', (c) => {
  return c.html(getAdminPage());
});

// Waline frontend UI (root page)
app.get('/', async (c) => {
  const html = await getWalinePage(c.env, c.req.url);
  return c.html(html);
});

export default app;
