export interface AnimationDef {
  row: number
  frames: number
  speed: number // frames per tick
}

export interface SpriteSheetDef {
  id: string
  path: string
  frameWidth: number
  frameHeight: number
  directions: number
  anchorX: number
  anchorY: number
  animations: Record<string, AnimationDef>
}

export interface AssetManifest {
  units: Record<string, SpriteSheetDef>
  towers: Record<string, SpriteSheetDef>
}

export async function loadManifest(url = '/assets/manifest.json'): Promise<AssetManifest> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`failed to load manifest: ${res.status}`)
  return res.json() as Promise<AssetManifest>
}

/** Direction row index from a world heading (radians, 0 = +x, PI/2 = +y/north). */
export function headingToDirection(heading: number, directions = 8): number {
  const angle = Math.atan2(Math.sin(heading), Math.cos(heading))
  const fromNorth = (Math.PI / 2 - angle + Math.PI * 2) % (Math.PI * 2)
  return Math.round((fromNorth / (Math.PI * 2)) * directions) % directions
}

export function getFrame(
  def: SpriteSheetDef,
  anim: string,
  direction: number,
  frame: number,
): number {
  const a = def.animations[anim] ?? Object.values(def.animations)[0]
  if (!a) return 0
  const row = a.row + (direction % def.directions)
  const col = Math.abs(frame) % a.frames
  return row * a.frames + col
}

export function validateManifest(m: AssetManifest): string[] {
  const errors: string[] = []
  for (const [kind, map] of Object.entries({ units: m.units, towers: m.towers })) {
    for (const [id, def] of Object.entries(map)) {
      if (def.id !== id) errors.push(`${kind}.${id}: id mismatch (${def.id})`)
      if (def.frameWidth <= 0) errors.push(`${kind}.${id}: bad frameWidth`)
      if (def.frameHeight <= 0) errors.push(`${kind}.${id}: bad frameHeight`)
      if (def.directions !== 8) errors.push(`${kind}.${id}: directions must be 8`)
      if (Object.keys(def.animations).length === 0) errors.push(`${kind}.${id}: no animations`)
    }
  }
  return errors
}
