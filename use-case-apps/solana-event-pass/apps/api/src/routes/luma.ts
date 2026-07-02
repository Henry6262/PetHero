import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { lumaClient } from '../lib/luma.js';
import { syncLumaEvent } from '../services/events.js';
import { authMiddleware } from '../middleware/auth.js';
import type { UserVariables } from '../types/hono.js';

const app = new Hono<{ Variables: UserVariables }>();

app.use('*', authMiddleware);

const syncSchema = z.object({
  calendarId: z.string().optional(),
});

app.post('/sync', zValidator('json', syncSchema), async (c) => {
  if (!lumaClient) {
    return c.json({ error: 'Luma API not configured' }, 400);
  }

  try {
    const { calendarId } = c.req.valid('json');
    const lumaEvents = await lumaClient.listEvents(calendarId);
    const synced = await Promise.all(lumaEvents.map(syncLumaEvent));

    return c.json({
      synced: synced.length,
      events: synced.map((e) => ({ id: e.id, name: e.name })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Luma sync failed';
    return c.json({ error: message }, 500);
  }
});

export default app;
