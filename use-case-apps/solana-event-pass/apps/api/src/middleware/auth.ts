import { createMiddleware } from 'hono/factory';
import { eq } from 'drizzle-orm';
import { verifyJwt } from '../services/auth.js';
import { db } from '../db.js';
import { users } from '@solana-event-pass/db';
import type { ApiContext } from '../types/index.js';

export const authMiddleware = createMiddleware<{ Variables: { user: ApiContext['user'] } }>(
  async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = header.slice(7);
    try {
      const payload = verifyJwt(token);
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });

      c.set('user', {
        id: payload.userId,
        publicKey: payload.publicKey,
        role: user?.role ?? 'attendee',
      });
      await next();
    } catch (err) {
      console.error('JWT verify failed:', err);
      return c.json({ error: 'Invalid token' }, 401);
    }
  },
);
