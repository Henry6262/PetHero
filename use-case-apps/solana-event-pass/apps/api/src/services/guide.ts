import { eq, and, inArray, desc } from 'drizzle-orm';
import { db } from '../db.js';
import {
  locations,
  missions,
  rewards,
  userMissionProgress,
  userRewards,
  users,
  events,
} from '@solana-event-pass/db';
import type {
  Location,
  Mission,
  Reward,
  NewLocation,
  NewMission,
  NewReward,
} from '@solana-event-pass/db';

const EARTH_RADIUS_METERS = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

// Locations

export async function listLocations(eventId: string, category?: string) {
  const where = category
    ? and(eq(locations.eventId, eventId), eq(locations.category, category), eq(locations.status, 'active'))
    : and(eq(locations.eventId, eventId), eq(locations.status, 'active'));

  return db.query.locations.findMany({
    where,
    orderBy: desc(locations.createdAt),
  });
}

export async function getLocation(locationId: string) {
  return db.query.locations.findFirst({
    where: eq(locations.id, locationId),
  });
}

export async function createLocation(input: NewLocation) {
  const [location] = await db.insert(locations).values(input).returning();
  return location;
}

export async function updateLocation(locationId: string, input: Partial<NewLocation>) {
  const [location] = await db
    .update(locations)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(locations.id, locationId))
    .returning();
  return location;
}

// Missions

export async function listMissions(eventId: string, userId: string) {
  const missionList = await db.query.missions.findMany({
    where: and(eq(missions.eventId, eventId), eq(missions.status, 'active')),
    orderBy: desc(missions.createdAt),
  });

  const progressList = await db.query.userMissionProgress.findMany({
    where: eq(userMissionProgress.userId, userId),
  });

  return missionList.map((mission) => {
    const progress = progressList.find((p) => p.missionId === mission.id);
    const completedIds = (progress?.completedLocationIds as string[]) ?? [];
    const requiredIds = (mission.requiredLocationIds as string[]) ?? [];
    const completedCount = completedIds.length;
    const totalCount = requiredIds.length;

    return {
      ...mission,
      progress: {
        status: progress?.status ?? 'in_progress',
        completedLocationIds: completedIds,
        completedCount,
        totalCount,
        completedAt: progress?.completedAt,
      },
    };
  });
}

export async function createMission(input: NewMission) {
  const [mission] = await db.insert(missions).values(input).returning();
  return mission;
}

export async function updateMission(missionId: string, input: Partial<NewMission>) {
  const [mission] = await db
    .update(missions)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(missions.id, missionId))
    .returning();
  return mission;
}

// Rewards

export async function listRewards(eventId: string, userId: string) {
  const rewardList = await db.query.rewards.findMany({
    where: and(eq(rewards.eventId, eventId), eq(rewards.status, 'active')),
    orderBy: desc(rewards.createdAt),
  });

  const claimed = await db.query.userRewards.findMany({
    where: eq(userRewards.userId, userId),
  });

  return rewardList.map((reward) => {
    const userReward = claimed.find((r) => r.rewardId === reward.id);
    return {
      ...reward,
      userStatus: userReward?.status ?? 'locked',
      claimCode: userReward?.claimCode,
    };
  });
}

export async function createReward(input: NewReward) {
  const [reward] = await db.insert(rewards).values(input).returning();
  return reward;
}

export async function updateReward(rewardId: string, input: Partial<NewReward>) {
  const [reward] = await db
    .update(rewards)
    .set({ ...input })
    .where(eq(rewards.id, rewardId))
    .returning();
  return reward;
}

// Check-ins

export interface CheckInInput {
  userId: string;
  locationId: string;
  method: 'geofence' | 'qr';
  lat?: number;
  lng?: number;
}

export async function checkInToLocation(input: CheckInInput) {
  const location = await db.query.locations.findFirst({
    where: eq(locations.id, input.locationId),
  });

  if (!location) {
    throw new Error('Location not found');
  }

  if (location.status !== 'active') {
    throw new Error('Location is not active');
  }

  // Verify geofence if method is geofence
  if (input.method === 'geofence') {
    if (input.lat == null || input.lng == null) {
      throw new Error('Coordinates required for geofence check-in');
    }
    const distance = haversineDistance(
      input.lat,
      input.lng,
      location.lat,
      location.lng,
    );

    // Default radius 100m; could be read from location metadata later
    const radius = 100;
    if (distance > radius) {
      throw new Error(`Too far from location: ${Math.round(distance)}m away`);
    }
  }

  // Find active missions that require this location
  const activeMissions = await db.query.missions.findMany({
    where: and(
      eq(missions.eventId, location.eventId),
      eq(missions.status, 'active'),
    ),
  });

  const completedMissions: Mission[] = [];

  for (const mission of activeMissions) {
    const requiredIds = (mission.requiredLocationIds as string[]) ?? [];
    if (!requiredIds.includes(input.locationId)) continue;

    let progress = await db.query.userMissionProgress.findFirst({
      where: and(
        eq(userMissionProgress.userId, input.userId),
        eq(userMissionProgress.missionId, mission.id),
      ),
    });

    const completedIds = new Set<string>(
      (progress?.completedLocationIds as string[]) ?? [],
    );
    completedIds.add(input.locationId);
    const completedArray = Array.from(completedIds);
    const isComplete = requiredIds.every((id) => completedIds.has(id));

    if (progress) {
      await db
        .update(userMissionProgress)
        .set({
          completedLocationIds: completedArray,
          status: isComplete ? 'completed' : 'in_progress',
          completedAt: isComplete ? new Date() : progress.completedAt,
          updatedAt: new Date(),
        })
        .where(eq(userMissionProgress.id, progress.id));
    } else {
      await db.insert(userMissionProgress).values({
        userId: input.userId,
        missionId: mission.id,
        completedLocationIds: completedArray,
        status: isComplete ? 'completed' : 'in_progress',
        completedAt: isComplete ? new Date() : undefined,
      });
    }

    if (isComplete) {
      completedMissions.push(mission);
      await grantMissionReward(input.userId, mission);
    }
  }

  return {
    location,
    completedMissions,
  };
}

async function grantMissionReward(userId: string, mission: Mission) {
  if (!mission.rewardId) return;

  const reward = await db.query.rewards.findFirst({
    where: eq(rewards.id, mission.rewardId),
  });

  if (!reward || reward.status !== 'active') return;

  const existing = await db.query.userRewards.findFirst({
    where: and(eq(userRewards.userId, userId), eq(userRewards.rewardId, reward.id)),
  });

  if (existing) return;

  await db.insert(userRewards).values({
    userId,
    rewardId: reward.id,
    status: 'unclaimed',
    claimCode: generateClaimCode(),
  });
}

function generateClaimCode(): string {
  return `SEP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export async function claimReward(userId: string, rewardId: string) {
  const reward = await db.query.rewards.findFirst({
    where: eq(rewards.id, rewardId),
  });

  if (!reward) {
    throw new Error('Reward not found');
  }

  const userReward = await db.query.userRewards.findFirst({
    where: and(eq(userRewards.userId, userId), eq(userRewards.rewardId, rewardId)),
  });

  if (!userReward) {
    throw new Error('Reward not unlocked');
  }

  if (userReward.status === 'claimed') {
    throw new Error('Reward already claimed');
  }

  const [updated] = await db
    .update(userRewards)
    .set({ status: 'claimed', claimedAt: new Date() })
    .where(eq(userRewards.id, userReward.id))
    .returning();

  return {
    reward,
    userReward: updated,
  };
}

// Admin helpers

export async function assertOrganizer(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    throw new Error('Forbidden');
  }
}

export async function assertEventExists(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!event) {
    throw new Error('Event not found');
  }
}
