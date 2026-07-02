import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { config } from './config.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import eventsRoutes from './routes/events.js';
import paymentsRoutes from './routes/payments.js';
import walletRoutes from './routes/wallet.js';
import guideRoutes from './routes/guide.js';
import lumaRoutes from './routes/luma.js';

const app = new Hono();

app.use(logger());
app.use(
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.route('/health', healthRoutes);
app.route('/auth', authRoutes);
app.route('/events', eventsRoutes);
app.route('/payments', paymentsRoutes);
app.route('/wallet', walletRoutes);
app.route('/guide', guideRoutes);
app.route('/luma', lumaRoutes);

app.get('/', (c) => {
  return c.json({
    name: 'Solana Event Pass API',
    version: '0.1.0',
    network: config.SOLANA_NETWORK,
  });
});

const server = Bun.serve({
  port: config.PORT,
  fetch: app.fetch,
});

console.log(`Solana Event Pass API running at http://localhost:${server.port}`);

// Export app for testing only; not a server config so Bun won't auto-serve.
export { app };
