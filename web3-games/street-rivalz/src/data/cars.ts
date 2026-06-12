import { KartParams } from '../sim/kart'

export interface CarDef {
  id: string
  name: string
  archetype: string
  params: KartParams
  color: number // default placeholder body color
}

const BASE_BOOST_TIERS: [number, number, number] = [0.7, 1.4, 2.2]
const BASE_BOOST_TICKS: [number, number, number] = [28, 50, 80]

export const CARS: CarDef[] = [
  {
    id: 'paper-scooter',
    name: 'Paper Hands Scooter',
    archetype: 'starter',
    params: {
      accel: 22, brake: 48, maxSpeed: 24, reverseMax: 8,
      drag: 0.45, grip: 8, driftGrip: 2.2,
      steerRate: 2.0, driftSteerBonus: 1.15, driftMinSpeed: 10,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 36, boostMaxSpeed: 31,
    },
    color: 0xfacc15,
  },
  {
    id: 'whale-limo',
    name: 'Whale Limo',
    archetype: 'heavy',
    params: {
      accel: 20, brake: 52, maxSpeed: 28, reverseMax: 7,
      drag: 0.42, grip: 9, driftGrip: 2.0,
      steerRate: 1.8, driftSteerBonus: 1.05, driftMinSpeed: 11,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 36, boostMaxSpeed: 33,
    },
    color: 0x3b82f6,
  },
  {
    id: 'jeet-tuk-tuk',
    name: 'Jeet Tuk-Tuk',
    archetype: 'light',
    params: {
      accel: 30, brake: 45, maxSpeed: 25, reverseMax: 8,
      drag: 0.48, grip: 6, driftGrip: 2.6,
      steerRate: 2.4, driftSteerBonus: 1.35, driftMinSpeed: 9,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 40, boostMaxSpeed: 32,
    },
    color: 0xf97316,
  },
  {
    id: 'diamond-hands',
    name: 'Diamond Hands Monster Truck',
    archetype: 'tank',
    params: {
      accel: 24, brake: 55, maxSpeed: 25, reverseMax: 8,
      drag: 0.46, grip: 11, driftGrip: 1.9,
      steerRate: 1.9, driftSteerBonus: 1.05, driftMinSpeed: 12,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 38, boostMaxSpeed: 32,
    },
    color: 0x22c55e,
  },
  {
    id: 'rug-dev',
    name: 'Rug Dev Getaway Car',
    archetype: 'drift',
    params: {
      accel: 25, brake: 50, maxSpeed: 26, reverseMax: 8,
      drag: 0.44, grip: 8.5, driftGrip: 3.0,
      steerRate: 2.2, driftSteerBonus: 1.25, driftMinSpeed: 10,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 38, boostMaxSpeed: 33,
    },
    color: 0xa855f7,
  },
  {
    id: 'mev-bot',
    name: 'MEV Bot F1',
    archetype: 'glass-cannon',
    params: {
      accel: 28, brake: 48, maxSpeed: 30, reverseMax: 7,
      drag: 0.40, grip: 6.5, driftGrip: 2.4,
      steerRate: 2.0, driftSteerBonus: 1.1, driftMinSpeed: 11,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 42, boostMaxSpeed: 35,
    },
    color: 0xef4444,
  },
]

export function carById(id: string): CarDef {
  const c = CARS.find((c) => c.id === id)
  if (!c) throw new Error(`unknown car ${id}`)
  return c
}

export const DEFAULT_CAR = CARS[0]
