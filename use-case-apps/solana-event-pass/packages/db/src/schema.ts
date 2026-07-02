import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  doublePrecision,
  jsonb,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  publicKey: varchar('public_key', { length: 64 }).notNull().unique(),
  role: varchar('role', { length: 50 }).notNull().default('attendee'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  externalId: varchar('external_id', { length: 255 }),
  source: varchar('source', { length: 50 }).notNull().default('manual'), // luma, river, eventbrite, manual
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  coverImage: text('cover_image'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  timezone: varchar('timezone', { length: 100 }).default('UTC'),
  venueName: varchar('venue_name', { length: 255 }),
  venueAddress: text('venue_address'),
  city: varchar('city', { length: 100 }),
  country: varchar('country', { length: 100 }),
  status: varchar('status', { length: 50 }).notNull().default('draft'),
  organizerId: uuid('organizer_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  location: varchar('location', { length: 255 }),
  track: varchar('track', { length: 100 }),
  speakers: jsonb('speakers').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const ticketTypes = pgTable('ticket_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  priceUsd: decimal('price_usd', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 10 }).default('USD'),
  capacity: integer('capacity'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  ticketTypeId: uuid('ticket_type_id').references(() => ticketTypes.id),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  externalId: varchar('external_id', { length: 255 }),
  email: varchar('email', { length: 255 }),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const eventTokens = pgTable('event_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' })
    .unique(),
  mintAddress: varchar('mint_address', { length: 64 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  symbol: varchar('symbol', { length: 20 }).notNull(),
  decimals: integer('decimals').notNull().default(6),
  usdcEscrowAddress: varchar('usdc_escrow_address', { length: 64 }).notNull(),
  conversionRate: decimal('conversion_rate', { precision: 10, scale: 6 }).notNull().default('1'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tokenBalances = pgTable('token_balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  eventTokenId: uuid('event_token_id')
    .notNull()
    .references(() => eventTokens.id, { onDelete: 'cascade' }),
  balance: decimal('balance', { precision: 20, scale: 6 }).notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  description: text('description'),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const eventVendors = pgTable('event_vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id')
    .notNull()
    .references(() => vendors.id, { onDelete: 'cascade' }),
  payoutAddress: varchar('payout_address', { length: 64 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const terminals = pgTable('terminals', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventVendorId: uuid('event_vendor_id')
    .notNull()
    .references(() => eventVendors.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  walletAddress: varchar('wallet_address', { length: 64 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  eventTokenId: uuid('event_token_id')
    .notNull()
    .references(() => eventTokens.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // topup, refund
  amountTokens: decimal('amount_tokens', { precision: 20, scale: 6 }).notNull(),
  amountUsd: decimal('amount_usd', { precision: 20, scale: 6 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(), // usdc, fiat
  externalReference: varchar('external_reference', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderUserId: uuid('sender_user_id').references(() => users.id),
  terminalId: uuid('terminal_id').references(() => terminals.id),
  eventTokenId: uuid('event_token_id')
    .notNull()
    .references(() => eventTokens.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 20, scale: 6 }).notNull(),
  signature: varchar('signature', { length: 128 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

export const poaps = pgTable('poaps', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  mintAddress: varchar('mint_address', { length: 64 }),
  name: varchar('name', { length: 255 }).notNull(),
  imageUrl: text('image_url'),
  claimMethod: varchar('claim_method', { length: 50 }).notNull().default('checkin'),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const locations = pgTable('locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // food, drinks, party, landmark, culture, etc.
  address: text('address'),
  lat: doublePrecision('lat').notNull(),
  lng: doublePrecision('lng').notNull(),
  imageUrl: text('image_url'),
  partnerName: varchar('partner_name', { length: 255 }),
  partnerWebsite: text('partner_website'),
  discountDescription: text('discount_description'),
  discountCode: varchar('discount_code', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rewards = pgTable('rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // token, poap, merch, discount
  value: text('value'), // token amount, discount code, merch sku, etc.
  imageUrl: text('image_url'),
  totalSupply: integer('total_supply'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const missions = pgTable('missions', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  rewardId: uuid('reward_id').references(() => rewards.id, { onDelete: 'set null' }),
  requiredLocationIds: jsonb('required_location_ids').default([]).notNull(),
  verificationMethod: varchar('verification_method', { length: 50 }).notNull().default('geofence'), // geofence | qr
  geofenceRadiusMeters: integer('geofence_radius_meters').default(100),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userMissionProgress = pgTable('user_mission_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  missionId: uuid('mission_id')
    .notNull()
    .references(() => missions.id, { onDelete: 'cascade' }),
  completedLocationIds: jsonb('completed_location_ids').default([]).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('in_progress'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userRewards = pgTable('user_rewards', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id')
    .notNull()
    .references(() => rewards.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 50 }).notNull().default('unclaimed'),
  claimCode: varchar('claim_code', { length: 255 }),
  claimedAt: timestamp('claimed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type EventToken = typeof eventTokens.$inferSelect;
export type TokenBalance = typeof tokenBalances.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Poap = typeof poaps.$inferSelect;
export type Vendor = typeof vendors.$inferSelect;
export type Terminal = typeof terminals.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type NewLocation = typeof locations.$inferInsert;
export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type UserMissionProgress = typeof userMissionProgress.$inferSelect;
export type UserReward = typeof userRewards.$inferSelect;
