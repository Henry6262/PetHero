import { Hono } from 'hono';
import { db, pool } from '../db.js';
import { sql } from 'drizzle-orm';

const app = new Hono();

app.get('/', async (c) => {
  let dbStatus = 'ok';
  try {
    await db.execute(sql`SELECT 1`);
  } catch {
    dbStatus = 'error';
  }

  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

export default app;
