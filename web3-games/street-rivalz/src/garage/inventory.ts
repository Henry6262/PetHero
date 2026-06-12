import { Loadout, DEFAULT_LOADOUT, allOwnedItems, WHEELS, SPOILERS, TRAILS, PAINTS, bodyItem } from '../data/garage'

export type { Loadout }
export { DEFAULT_LOADOUT }

export function isValidLoadout(loadout: Partial<Loadout>): loadout is Loadout {
  if (!loadout.body || !bodyItem(loadout.body)) return false
  if (!loadout.wheels || !WHEELS.find((w) => w.id === loadout.wheels)) return false
  if (loadout.spoiler && !SPOILERS.find((s) => s.id === loadout.spoiler)) return false
  if (loadout.trail === undefined || !TRAILS.find((t) => t.id === loadout.trail)) return false
  if (loadout.paint === undefined || !PAINTS.find((p) => p.color === loadout.paint)) return false
  return true
}

export function normalizeLoadout(loadout: Partial<Loadout>): Loadout {
  return {
    body: loadout.body && bodyItem(loadout.body) ? loadout.body : DEFAULT_LOADOUT.body,
    wheels: loadout.wheels && WHEELS.find((w) => w.id === loadout.wheels) ? loadout.wheels : DEFAULT_LOADOUT.wheels,
    spoiler: loadout.spoiler && SPOILERS.find((s) => s.id === loadout.spoiler) ? loadout.spoiler : undefined,
    paint: loadout.paint !== undefined && PAINTS.find((p) => p.color === loadout.paint) ? loadout.paint : DEFAULT_LOADOUT.paint,
    trail: loadout.trail && TRAILS.find((t) => t.id === loadout.trail) ? loadout.trail : DEFAULT_LOADOUT.trail,
  }
}

export function getOwnedItems() {
  return {
    bodies: allOwnedItems().filter((i) => i.slot === 'body'),
    wheels: WHEELS,
    spoilers: SPOILERS,
    paints: PAINTS,
    trails: TRAILS,
  }
}
