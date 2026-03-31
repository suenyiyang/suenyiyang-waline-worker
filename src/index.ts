import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, Variables } from './env.js';
import { auth } from './middleware/auth.js';
import { commentRoutes } from './router/comment.js';
import { articleRoutes } from './router/article.js';
import { userRoutes } from './router/user.js';
import { tokenRoutes } from './router/token.js';

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

// Health check / root
app.get('/', (c) => {
  return c.json({
    name: 'Waline on Worker',
    version: '0.1.0',
  });
});

export default app;
