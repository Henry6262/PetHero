import { eq, desc } from 'drizzle-orm';
import { db } from '../db.js';
import { events, sessions, eventTokens, tokenBalances } from '@solana-event-pass/db';
import type { LumaEvent } from '../lib/luma.js';

export async function listEventsForUser(userId: string) {
  // In MVP, return all published events plus token balances if any.
  const allEvents = await db.query.events.findMany({
    where: eq(events.status, 'published'),
    orderBy: desc(events.startAt),
  });

  const tokens = await db.query.eventTokens.findMany();
  const balances = await db.query.tokenBalances.findMany({
    where: eq(tokenBalances.userId, userId),
  });

  return allEvents.map((event) => {
    const token = tokens.find((t) => t.eventId === event.id);
    const balance = token
      ? balances.find((b) => b.eventTokenId === token.id)?.balance ?? '0'
      : '0';

    return {
      id: event.id,
      name: event.name,
      description: event.description,
      startAt: event.startAt,
      endAt: event.endAt,
      city: event.city,
      country: event.country,
      venueName: event.venueName,
      coverImage: event.coverImage,
      tokenBalance: balance,
      tokenSymbol: token?.symbol,
    };
  });
}

export async function getEventDetail(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) return null;

  const eventSessions = await db.query.sessions.findMany({
    where: eq(sessions.eventId, eventId),
    orderBy: desc(sessions.startAt),
  });

  const token = await db.query.eventTokens.findFirst({
    where: eq(eventTokens.eventId, eventId),
  });

  return {
    id: event.id,
    name: event.name,
    description: event.description,
    startAt: event.startAt,
    endAt: event.endAt,
    timezone: event.timezone,
    venueName: event.venueName,
    venueAddress: event.venueAddress,
    city: event.city,
    country: event.country,
    coverImage: event.coverImage,
    token: token
      ? {
          id: token.id,
          mintAddress: token.mintAddress,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
        }
      : null,
    sessions: eventSessions.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      startAt: s.startAt,
      endAt: s.endAt,
      location: s.location,
      track: s.track,
      speakers: s.speakers,
    })),
  };
}

export async function syncLumaEvent(lumaEvent: LumaEvent) {
  const startAt = new Date(lumaEvent.start_at);
  const endAt = new Date(lumaEvent.end_at);

  const [event] = await db
    .insert(events)
    .values({
      externalId: lumaEvent.api_id,
      source: 'luma',
      name: lumaEvent.name,
      description: lumaEvent.description,
      startAt,
      endAt,
      timezone: lumaEvent.timezone,
      venueName: lumaEvent.location?.name,
      venueAddress: lumaEvent.location?.address,
      city: lumaEvent.location?.city,
      country: lumaEvent.location?.country,
      status: 'published',
    })
    .onConflictDoUpdate({
      target: [events.externalId, events.source],
      set: {
        name: lumaEvent.name,
        description: lumaEvent.description,
        startAt,
        endAt,
        timezone: lumaEvent.timezone,
        venueName: lumaEvent.location?.name,
        venueAddress: lumaEvent.location?.address,
        city: lumaEvent.location?.city,
        country: lumaEvent.location?.country,
        updatedAt: new Date(),
      },
    })
    .returning();

  return event;
}
