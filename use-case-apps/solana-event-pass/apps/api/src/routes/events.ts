import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { listEventsForUser, getEventDetail } from '../services/events.js';
import type { UserVariables } from '../types/hono.js';

const app = new Hono<{ Variables: UserVariables }>();

app.use('*', authMiddleware);

app.get('/', async (c) => {
  const user = c.get('user');
  if (!user) return c.json({ error: 'Unauthorized' }, 401);

  const events = await listEventsForUser(user.id);
  return c.json({ events });
});

app.get('/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
  const { id } = c.req.valid('param');
  const event = await getEventDetail(id);

  if (!event) {
    return c.json({ error: 'Event not found' }, 404);
  }

  return c.json({ event });
});

export default app;
