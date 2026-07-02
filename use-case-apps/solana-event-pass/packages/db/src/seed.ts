import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import {
  users,
  events,
  sessions,
  eventTokens,
  tokenBalances,
  orders,
  transactions,
  vendors,
  eventVendors,
  terminals,
  locations,
  missions,
  rewards,
  userMissionProgress,
  userRewards,
} from './schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:15432/solana_event_pass',
});

const db = drizzle(pool);

let event1TokenId: string | undefined;
let terminalId: string | undefined;

async function seed() {
  console.log('Seeding database...');

  // Sample user
  const existingUsers = await db.select().from(users).where(eq(users.publicKey, '11111111111111111111111111111111'));
  let user = existingUsers[0];

  if (!user) {
    [user] = await db
      .insert(users)
      .values({
        publicKey: '11111111111111111111111111111111', // placeholder
        role: 'organizer',
      })
      .returning();
  } else {
    await db.update(users).set({ role: 'organizer' }).where(eq(users.id, user.id));
  }

  // Sample event: Blockchain Week Berlin
  const [event1] = await db
    .insert(events)
    .values({
      source: 'manual',
      name: 'Blockchain Week Berlin 2026',
      description: 'The biggest Web3 gathering in Berlin. Side events, summits, and builder meetups across the city.',
      coverImage: 'https://images.unsplash.com/photo-1599940824399-b87987ce0799?w=800',
      startAt: new Date('2026-06-15T09:00:00Z'),
      endAt: new Date('2026-06-21T23:00:00Z'),
      timezone: 'Europe/Berlin',
      venueName: 'Funkhaus Berlin',
      venueAddress: 'Nalepastraße 18, 12459 Berlin',
      city: 'Berlin',
      country: 'Germany',
      status: 'published',
    })
    .onConflictDoNothing({ target: events.name })
    .returning();

  if (event1) {
    await db.insert(sessions).values([
      {
        eventId: event1.id,
        title: 'Opening Keynote: The State of Solana',
        description: 'Solana Foundation update on ecosystem growth and 2026 roadmap.',
        startAt: new Date('2026-06-16T10:00:00Z'),
        endAt: new Date('2026-06-16T11:00:00Z'),
        location: 'Main Stage',
        track: 'Keynote',
        speakers: [{ name: 'Lily Liu', role: 'President, Solana Foundation' }],
      },
      {
        eventId: event1.id,
        title: 'Superteam Germany Ecosystem Day',
        description: 'Meet the builders and founders driving Solana adoption in Germany.',
        startAt: new Date('2026-06-16T13:00:00Z'),
        endAt: new Date('2026-06-16T17:00:00Z'),
        location: 'Hall B',
        track: 'Community',
        speakers: [{ name: 'Chris McNicholas', role: 'Global Events, Superteam' }],
      },
      {
        eventId: event1.id,
        title: 'Tokenized Payments Workshop',
        description: 'Hands-on session for event organizers on SPL token cashless systems.',
        startAt: new Date('2026-06-17T14:00:00Z'),
        endAt: new Date('2026-06-17T15:30:00Z'),
        location: 'Workshop Room 3',
        track: 'Workshop',
        speakers: [{ name: 'TBD', role: 'Workshop Lead' }],
      },
    ]);

    const [event1Token] = await db
      .insert(eventTokens)
      .values({
        eventId: event1.id,
        mintAddress: 'So11111111111111111111111111111111111111112', // placeholder devnet mint
        name: 'Berlin Blockchain Week Token',
        symbol: 'BBW26',
        decimals: 6,
        usdcEscrowAddress: '11111111111111111111111111111111',
        conversionRate: '1',
        isActive: true,
      })
      .returning();
    event1TokenId = event1Token.id;
  }

  // Sample event: Solana Breakpoint London
  const [event2] = await db
    .insert(events)
    .values({
      source: 'manual',
      name: 'Solana Breakpoint 2026 — London',
      description: 'The flagship Solana conference. 7,000+ builders, founders, and artists.',
      coverImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800',
      startAt: new Date('2026-11-09T09:00:00Z'),
      endAt: new Date('2026-11-12T23:00:00Z'),
      timezone: 'Europe/London',
      venueName: 'ExCeL London',
      venueAddress: 'Royal Victoria Dock, 1 Western Gateway, London E16 1XL',
      city: 'London',
      country: 'UK',
      status: 'published',
    })
    .onConflictDoNothing({ target: events.name })
    .returning();

  if (event2) {
    await db.insert(sessions).values([
      {
        eventId: event2.id,
        title: 'Breakpoint Opening Ceremony',
        description: 'Welcome to London. Ecosystem updates and keynote announcements.',
        startAt: new Date('2026-11-09T10:00:00Z'),
        endAt: new Date('2026-11-09T11:30:00Z'),
        location: 'Main Stage',
        track: 'Keynote',
        speakers: [{ name: 'Solana Foundation', role: 'Host' }],
      },
      {
        eventId: event2.id,
        title: 'DePIN & AI Summit',
        description: 'Exploring decentralized physical infrastructure and AI on Solana.',
        startAt: new Date('2026-11-10T10:00:00Z'),
        endAt: new Date('2026-11-10T13:00:00Z'),
        location: 'Summit Hall',
        track: 'DePIN',
        speakers: [{ name: 'TBD', role: 'Panel' }],
      },
    ]);

    await db.insert(eventTokens).values({
      eventId: event2.id,
      mintAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      name: 'Breakpoint London Token',
      symbol: 'BPLON26',
      decimals: 6,
      usdcEscrowAddress: '11111111111111111111111111111111',
      conversionRate: '1',
      isActive: true,
    });
  }

  // Sample vendor
  const [vendor] = await db
    .insert(vendors)
    .values({
      name: 'Funkhaus Coffee',
      description: 'Specialty coffee and snacks at Funkhaus Berlin.',
    })
    .onConflictDoNothing({ target: vendors.name })
    .returning();

  if (vendor && event1) {
    const [eventVendor] = await db
      .insert(eventVendors)
      .values({
        eventId: event1.id,
        vendorId: vendor.id,
        payoutAddress: '11111111111111111111111111111111',
      })
      .returning();

    if (eventVendor) {
      const [terminal] = await db
        .insert(terminals)
        .values({
          eventVendorId: eventVendor.id,
          name: 'Main Bar Terminal',
          walletAddress: '11111111111111111111111111111111',
        })
        .returning();
      terminalId = terminal.id;
    }
  }

  // Seed Belgrade event with locations, mission, and reward
  console.log('Seeding Belgrade... user:', user?.id);
  const belgradeEvents = await db.select().from(events).where(eq(events.name, 'Solana Summit Belgrade 2026'));
  let belgradeEvent = belgradeEvents[0];

  if (!belgradeEvent) {
    [belgradeEvent] = await db
      .insert(events)
      .values({
        source: 'manual',
        name: 'Solana Summit Belgrade 2026',
        description: 'Solana ecosystem summit in Belgrade. Explore the city, complete missions, earn rewards.',
        coverImage: 'https://images.unsplash.com/photo-1555992336-fb0d29498b13?w=800',
        startAt: new Date('2026-09-10T09:00:00Z'),
        endAt: new Date('2026-09-14T23:00:00Z'),
        timezone: 'Europe/Belgrade',
        venueName: 'Sava Centar',
        venueAddress: 'Milentija Popovića 9, Belgrade',
        city: 'Belgrade',
        country: 'Serbia',
        status: 'published',
      })
      .returning();
  }

  if (belgradeEvent && user) {
    console.log('Creating Belgrade content for event:', belgradeEvent.id);
    const [belgradeToken] = await db
      .insert(eventTokens)
      .values({
        eventId: belgradeEvent.id,
        mintAddress: 'BEL1111111111111111111111111111111111111111',
        name: 'Belgrade Summit Token',
        symbol: 'BEL26',
        decimals: 6,
        usdcEscrowAddress: '11111111111111111111111111111111',
        conversionRate: '1',
        isActive: true,
      })
      .returning();

    const seededLocations = await db
      .insert(locations)
      .values([
        {
          eventId: belgradeEvent.id,
          name: 'Kalemegdan Fortress',
          description: 'Historic fortress and park overlooking the confluence of the Sava and Danube rivers.',
          category: 'landmark',
          address: 'Belgrade Fortress, Belgrade',
          lat: 44.8230,
          lng: 20.4476,
          imageUrl: 'https://images.unsplash.com/photo-1565627704165-1d6429d5f598?w=400',
        },
        {
          eventId: belgradeEvent.id,
          name: 'Skadarlija',
          description: 'Bohemian quarter with traditional restaurants, cafes, and street art.',
          category: 'food',
          address: 'Skadarska, Belgrade',
          lat: 44.8176,
          lng: 20.4651,
          imageUrl: 'https://images.unsplash.com/photo-1565627704165-1d6429d5f598?w=400',
          partnerName: 'Tri šešira',
          discountDescription: '10% off dinner with event badge',
          discountCode: 'SOLANA10',
        },
        {
          eventId: belgradeEvent.id,
          name: 'Sava River Promenade',
          description: 'Walk, run, or grab a drink along the river. Popular sunset spot.',
          category: 'party',
          address: 'Sava River, Belgrade',
          lat: 44.8150,
          lng: 20.4410,
          imageUrl: 'https://images.unsplash.com/photo-1565627704165-1d6429d5f598?w=400',
        },
        {
          eventId: belgradeEvent.id,
          name: 'Saint Sava Temple',
          description: 'One of the largest Orthodox churches in the world.',
          category: 'landmark',
          address: 'Krušedolska 2a, Belgrade',
          lat: 44.7982,
          lng: 20.4669,
          imageUrl: 'https://images.unsplash.com/photo-1565627704165-1d6429d5f598?w=400',
        },
        {
          eventId: belgradeEvent.id,
          name: 'Drugarstvo',
          description: 'Cocktail bar with a laid-back vibe and great music.',
          category: 'drinks',
          address: 'Njegoševa 16, Belgrade',
          lat: 44.8189,
          lng: 20.4632,
          imageUrl: 'https://images.unsplash.com/photo-1565627704165-1d6429d5f598?w=400',
          partnerName: 'Drugarstvo Bar',
          discountDescription: 'Free welcome shot with event app',
          discountCode: 'SOLSHOT',
        },
      ])
      .returning();

    console.log('Seeded locations:', seededLocations.length);

    const [reward] = await db
      .insert(rewards)
      .values({
        eventId: belgradeEvent.id,
        title: 'Belgrade Explorer Merch Pack',
        description: 'Limited edition Solana x Belgrade t-shirt and stickers.',
        type: 'merch',
        value: 'TSHIRT-BEL-001',
        totalSupply: 100,
      })
      .returning();

    await db.insert(missions).values({
      eventId: belgradeEvent.id,
      title: 'Explore Belgrade',
      description: 'Visit 3 landmarks and 1 partner spot to unlock the merch pack.',
      rewardId: reward.id,
      requiredLocationIds: seededLocations.map((l) => l.id),
      verificationMethod: 'geofence',
      geofenceRadiusMeters: 100,
    });

    await db.insert(tokenBalances).values({
      userId: user.id,
      eventTokenId: belgradeToken.id,
      balance: '20.00',
    });
  }

  // Seed wallet data for the sample user against Blockchain Week Berlin
  if (user && event1TokenId && terminalId) {
    await db.insert(tokenBalances).values({
      userId: user.id,
      eventTokenId: event1TokenId,
      balance: '85.00',
    });

    await db.insert(orders).values({
      userId: user.id,
      eventTokenId: event1TokenId,
      type: 'topup',
      amountTokens: '100.00',
      amountUsd: '100.00',
      paymentMethod: 'usdc',
      status: 'completed',
    });

    await db.insert(transactions).values({
      senderUserId: user.id,
      terminalId,
      eventTokenId: event1TokenId,
      amount: '15.00',
      signature: '5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd5K2Qd',
      status: 'confirmed',
      metadata: { item: 'Coffee + croissant', vendor: 'Funkhaus Coffee' },
      confirmedAt: new Date(),
    });
  }

  console.log('Seed complete.');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
