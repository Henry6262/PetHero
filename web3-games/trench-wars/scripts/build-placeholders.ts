import fs from 'node:fs'
import path from 'node:path'
import { CARDS } from '../src/sim/cards.js'
import { createCanvas } from 'canvas'
import type { AssetManifest, SpriteSheetDef } from '../src/render/AssetManifest.js'

const FRAME_W = 64
const FRAME_H = 64
const DIRS = 8
const WALK_FRAMES = 4

interface PlaceholderDef {
  id: string
  label: string
  color: string
  radius: number
  isTower?: boolean
}

function cardColor(cost: number): string {
  const colors = ['#94a3b8', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#ec4899']
  return colors[Math.min(cost, colors.length - 1)]
}

function drawArrow(ctx: CanvasRenderingContext2D, cx: number, cy: number, angle: number, color: string, r: number) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, -r)
  ctx.lineTo(r * 0.6, r * 0.6)
  ctx.lineTo(0, r * 0.3)
  ctx.lineTo(-r * 0.6, r * 0.6)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawCircle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()
}

function buildSheet(def: PlaceholderDef, outDir: string) {
  const canvas = createCanvas(FRAME_W * WALK_FRAMES, FRAME_H * DIRS)
  const ctx = canvas.getContext('2d')

  for (let d = 0; d < DIRS; d++) {
    const angle = (Math.PI / 2) - (d / DIRS) * Math.PI * 2
    for (let f = 0; f < WALK_FRAMES; f++) {
      const x = f * FRAME_W
      const y = d * FRAME_H
      const cx = x + FRAME_W / 2
      const cy = y + FRAME_H / 2

      // frame background subtle grid
      ctx.fillStyle = ((f + d) % 2 === 0) ? '#0f172a' : '#111827'
      ctx.fillRect(x, y, FRAME_W, FRAME_H)

      if (def.isTower) {
        ctx.fillStyle = def.color
        ctx.fillRect(x + 16, y + 12, FRAME_W - 32, FRAME_H - 20)
        ctx.fillStyle = '#ffffff'
        ctx.font = '10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(def.label.slice(0, 3), cx, cy + 4)
      } else {
        const bounce = Math.sin((f / WALK_FRAMES) * Math.PI * 2) * 3
        drawCircle(ctx, cx, cy + bounce, def.radius, def.color)
        drawArrow(ctx, cx, cy + bounce, angle, '#ffffff', def.radius * 0.6)
      }
    }
  }

  const pngPath = path.join(outDir, `${def.id}.png`)
  const jsonPath = path.join(outDir, `${def.id}.json`)
  fs.writeFileSync(pngPath, canvas.toBuffer('image/png'))
  fs.writeFileSync(jsonPath, JSON.stringify({
    id: def.id,
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    directions: DIRS,
    anchorX: 0.5,
    anchorY: 0.75,
    animations: { walk: { row: 0, frames: WALK_FRAMES, speed: 0.25 } },
  }, null, 2))
  console.log(`placeholder: ${pngPath}`)
}

function sheetDef(id: string, isTower: boolean): SpriteSheetDef {
  return {
    id,
    path: `/assets/${isTower ? 'towers' : 'units'}/${id}.png`,
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    directions: DIRS,
    anchorX: 0.5,
    anchorY: isTower ? 0.85 : 0.75,
    animations: { walk: { row: 0, frames: WALK_FRAMES, speed: 0.25 } },
  }
}

function main() {
  const assetsDir = path.resolve(process.cwd(), 'public/assets')
  const unitsDir = path.join(assetsDir, 'units')
  const towersDir = path.join(assetsDir, 'towers')
  fs.mkdirSync(unitsDir, { recursive: true })
  fs.mkdirSync(towersDir, { recursive: true })

  const manifest: AssetManifest = { units: {}, towers: {} }

  for (const card of CARDS) {
    if (card.type === 'spell') continue
    const r = 7 + Math.min(14, (card.hp ?? 100) / 120)
    buildSheet({ id: card.id, label: card.name.slice(0, 4), color: cardColor(card.cost), radius: r }, unitsDir)
    manifest.units[card.id] = sheetDef(card.id, false)
  }

  for (const towerId of ['lane', 'king']) {
    buildSheet({ id: towerId, label: towerId.slice(0, 4).toUpperCase(), color: towerId === 'king' ? '#f59e0b' : '#64748b', radius: 0, isTower: true }, towersDir)
    manifest.towers[towerId] = sheetDef(towerId, true)
  }

  fs.writeFileSync(path.join(assetsDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`manifest: ${path.join(assetsDir, 'manifest.json')}`)
}

main()
