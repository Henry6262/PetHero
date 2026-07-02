import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import type { UserVariables } from '../types/hono.js';
import {
  listLocations,
  getLocation,
  createLocation,
  updateLocation,
  listMissions,
  createMission,
  updateMission,
  listRewards,
  createReward,
  updateReward,
  checkInToLocation,
  claimReward,
  assertOrganizer,
  assertEventExists,
} from '../services/guide.js';

const app = new Hono<{ Variables: UserVariables }>();

// Attendee endpoints
app.use('*', authMiddleware);

const eventIdParam = z.object({ eventId: z.string().uuid() });
const locationIdParam = z.object({ id: z.string().uuid() });
const rewardIdParam = z.object({ id: z.string().uuid() });
const missionIdParam = z.object({ id: z.string().uuid() });

app.get('/:eventId/locations', zValidator('param', eventIdParam), async (c) => {
  const user = c.get('user');
  const { eventId } = c.req.valid('param');
  const category = c.req.query('category');

  try {
    const items = await listLocations(eventId, category);
    return c.json({ locations: items });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load locations';
    return c.json({ error: message }, 400);
  }
});

app.get('/locations/:id', zValidator('param', locationIdParam), async (c) => {
  const { id } = c.req.valid('param');
  const location = await getLocation(id);
  if (!location) return c.json({ error: 'Location not found' }, 404);
  return c.json({ location });
});

const checkInSchema = z.object({
  method: z.enum(['geofence', 'qr']),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

app.post(
  '/locations/:id/checkin',
  zValidator('param', locationIdParam),
  zValidator('json', checkInSchema),
  async (c) => {
    const user = c.get('user');
    const { id } = c.req.valid('param');
    const body = c.req.valid('json');

    try {
      const result = await checkInToLocation({
        userId: user.id,
        locationId: id,
        method: body.method,
        lat: body.lat,
        lng: body.lng,
      });
      return c.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Check-in failed';
      return c.json({ error: message }, 400);
    }
  },
);

app.get('/:eventId/missions', zValidator('param', eventIdParam), async (c) => {
  const user = c.get('user');
  const { eventId } = c.req.valid('param');

  try {
    const missions = await listMissions(eventId, user.id);
    return c.json({ missions });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load missions';
    return c.json({ error: message }, 400);
  }
});

app.get('/:eventId/rewards', zValidator('param', eventIdParam), async (c) => {
  const user = c.get('user');
  const { eventId } = c.req.valid('param');

  try {
    const rewards = await listRewards(eventId, user.id);
    return c.json({ rewards });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load rewards';
    return c.json({ error: message }, 400);
  }
});

app.post('/rewards/:id/claim', zValidator('param', rewardIdParam), async (c) => {
  const user = c.get('user');
  const { id } = c.req.valid('param');

  try {
    const result = await claimReward(user.id, id);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to claim reward';
    return c.json({ error: message }, 400);
  }
});

// Admin endpoints
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get('user');
  try {
    await assertOrganizer(user.id);
    await next();
  } catch {
    return c.json({ error: 'Forbidden' }, 403);
  }
};

app.use('/admin/*', adminMiddleware);

const locationSchema = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  address: z.string().optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  imageUrl: z.string().url().optional(),
  partnerName: z.string().optional(),
  partnerWebsite: z.string().url().optional(),
  discountDescription: z.string().optional(),
  discountCode: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

app.post('/admin/locations', zValidator('json', locationSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    await assertEventExists(body.eventId);
    const location = await createLocation(body);
    return c.json({ location }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create location';
    return c.json({ error: message }, 400);
  }
});

app.put('/admin/locations/:id', zValidator('param', locationIdParam), zValidator('json', locationSchema.partial()), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const location = await updateLocation(id, c.req.valid('json'));
    if (!location) return c.json({ error: 'Location not found' }, 404);
    return c.json({ location });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update location';
    return c.json({ error: message }, 400);
  }
});

const missionSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  rewardId: z.string().uuid().optional(),
  requiredLocationIds: z.array(z.string().uuid()),
  verificationMethod: z.enum(['geofence', 'qr']).optional(),
  geofenceRadiusMeters: z.number().min(10).max(2000).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

app.post('/admin/missions', zValidator('json', missionSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    await assertEventExists(body.eventId);
    const mission = await createMission({
      ...body,
      requiredLocationIds: body.requiredLocationIds,
    });
    return c.json({ mission }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create mission';
    return c.json({ error: message }, 400);
  }
});

app.put('/admin/missions/:id', zValidator('param', missionIdParam), zValidator('json', missionSchema.partial()), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const mission = await updateMission(id, c.req.valid('json'));
    if (!mission) return c.json({ error: 'Mission not found' }, 404);
    return c.json({ mission });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update mission';
    return c.json({ error: message }, 400);
  }
});

const rewardSchema = z.object({
  eventId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['token', 'poap', 'merch', 'discount']),
  value: z.string().optional(),
  imageUrl: z.string().url().optional(),
  totalSupply: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

app.post('/admin/rewards', zValidator('json', rewardSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    await assertEventExists(body.eventId);
    const reward = await createReward(body);
    return c.json({ reward }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create reward';
    return c.json({ error: message }, 400);
  }
});

app.put('/admin/rewards/:id', zValidator('param', rewardIdParam), zValidator('json', rewardSchema.partial()), async (c) => {
  try {
    const { id } = c.req.valid('param');
    const reward = await updateReward(id, c.req.valid('json'));
    if (!reward) return c.json({ error: 'Reward not found' }, 404);
    return c.json({ reward });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update reward';
    return c.json({ error: message }, 400);
  }
});

export default app;
