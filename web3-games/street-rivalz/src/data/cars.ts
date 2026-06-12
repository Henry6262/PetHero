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
    id: 'toyota-supra',
    name: 'Toyota Supra MK4',
    archetype: 'balanced',
    params: {
      accel: 25, brake: 50, maxSpeed: 26, reverseMax: 8,
      drag: 0.44, grip: 8.5, driftGrip: 2.8,
      steerRate: 2.1, driftSteerBonus: 1.25, driftMinSpeed: 10,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 38, boostMaxSpeed: 33,
    },
    color: 0xff6600,
  },
  {
    id: 'bmw-m4',
    name: 'BMW M4',
    archetype: 'handling',
    params: {
      accel: 23, brake: 52, maxSpeed: 26, reverseMax: 8,
      drag: 0.42, grip: 10.5, driftGrip: 2.2,
      steerRate: 2.2, driftSteerBonus: 1.1, driftMinSpeed: 11,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 36, boostMaxSpeed: 32,
    },
    color: 0x4a90e2,
  },
  {
    id: 'audi-r8',
    name: 'Audi R8',
    archetype: 'all-rounder',
    params: {
      accel: 24, brake: 50, maxSpeed: 27, reverseMax: 8,
      drag: 0.43, grip: 9, driftGrip: 2.4,
      steerRate: 2.0, driftSteerBonus: 1.15, driftMinSpeed: 10,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 37, boostMaxSpeed: 33,
    },
    color: 0xc0c0c0,
  },
  {
    id: 'chevrolet-camaro',
    name: 'Chevrolet Camaro',
    archetype: 'brawler',
    params: {
      accel: 27, brake: 48, maxSpeed: 25, reverseMax: 8,
      drag: 0.46, grip: 8, driftGrip: 2.0,
      steerRate: 1.9, driftSteerBonus: 1.05, driftMinSpeed: 11,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 38, boostMaxSpeed: 31,
    },
    color: 0xfacc15,
  },
  {
    id: 'dodge-challenger',
    name: 'Dodge Challenger Hellcat',
    archetype: 'top-speed',
    params: {
      accel: 20, brake: 52, maxSpeed: 30, reverseMax: 7,
      drag: 0.40, grip: 7, driftGrip: 1.9,
      steerRate: 1.7, driftSteerBonus: 1.0, driftMinSpeed: 12,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 40, boostMaxSpeed: 35,
    },
    color: 0x111111,
  },
  {
    id: 'nissan-gtr',
    name: 'Nissan GT-R R35',
    archetype: 'launch',
    params: {
      accel: 30, brake: 48, maxSpeed: 27, reverseMax: 8,
      drag: 0.44, grip: 9.5, driftGrip: 2.3,
      steerRate: 2.0, driftSteerBonus: 1.1, driftMinSpeed: 10,
      chargeTiers: BASE_BOOST_TIERS, boostTicks: BASE_BOOST_TICKS,
      boostAccel: 42, boostMaxSpeed: 34,
    },
    color: 0x4a4a4a,
  },
]

export function carById(id: string): CarDef {
  const c = CARS.find((c) => c.id === id)
  if (!c) throw new Error(`unknown car ${id}`)
  return c
}

export const DEFAULT_CAR = CARS[0]
