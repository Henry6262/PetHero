import type { UnitEntity, Tower } from '../sim/types'
import { headingToDirection, getFrame, type AssetManifest, type SpriteSheetDef } from './AssetManifest'

export interface SpritePool {
  get(id: number): Phaser.GameObjects.Sprite | undefined
  set(id: number, sprite: Phaser.GameObjects.Sprite): void
  remove(id: number): void
  all(): IterableIterator<Phaser.GameObjects.Sprite>
  entries(): IterableIterator<[number, Phaser.GameObjects.Sprite]>
}

export function createSpritePool(): SpritePool {
  const map = new Map<number, Phaser.GameObjects.Sprite>()
  return {
    get: (id) => map.get(id),
    set: (id, sprite) => map.set(id, sprite),
    remove: (id) => { map.get(id)?.destroy(); map.delete(id) },
    all: () => map.values(),
    entries: () => map.entries(),
  }
}

export function loadManifestIntoScene(scene: Phaser.Scene, manifest: AssetManifest): void {
  for (const map of [manifest.units, manifest.towers]) {
    for (const def of Object.values(map)) {
      scene.load.spritesheet(def.id, def.path, {
        frameWidth: def.frameWidth,
        frameHeight: def.frameHeight,
      })
    }
  }
}

export function unitHeading(u: UnitEntity): number {
  // Units don't store heading; derive from last movement. For now use owner direction.
  // Positive Y = toward enemy for player 0; negative Y for player 1.
  return u.owner === 0 ? Math.PI / 2 : -Math.PI / 2
}

export function updateUnitSprite(
  sprite: Phaser.GameObjects.Sprite,
  u: UnitEntity,
  def: SpriteSheetDef,
  tick: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
): void {
  const anim = Object.values(def.animations)[0]
  const frame = anim ? Math.floor(tick * anim.speed) % anim.frames : 0
  const dir = headingToDirection(unitHeading(u))
  const index = getFrame(def, anim ? 'walk' : '', dir, frame)
  sprite.setTexture(def.id, index)
  sprite.setPosition(sx(u.x), sy(u.y))
  sprite.setOrigin(def.anchorX, def.anchorY)
  sprite.setAlpha(u.revealed ? 1 : 0.45)
}

export function updateTowerSprite(
  sprite: Phaser.GameObjects.Sprite,
  t: Tower,
  def: SpriteSheetDef,
  sx: (x: number) => number,
  sy: (y: number) => number,
): void {
  sprite.setTexture(def.id, 0)
  sprite.setPosition(sx(t.x), sy(t.y))
  sprite.setOrigin(def.anchorX, def.anchorY)
  sprite.setAlpha(t.active ? 1 : 0.5)
}
