import fs from 'node:fs'
import path from 'node:path'
import { createCanvas } from 'canvas'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const FRAME_W = 128
const FRAME_H = 128
const DIRS = 8
const FRAMES = 8

function hashColor(id: string): string {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const hue = h % 360
  return `hsl(${hue}, 70%, 50%)`
}

function buildFallbackSheet(id: string, outDir: string) {
  const canvas = createCanvas(FRAME_W * FRAMES, FRAME_H * DIRS)
  const ctx = canvas.getContext('2d')
  const color = hashColor(id)

  for (let d = 0; d < DIRS; d++) {
    const angle = (Math.PI / 2) - (d / DIRS) * Math.PI * 2
    for (let f = 0; f < FRAMES; f++) {
      const x = f * FRAME_W
      const y = d * FRAME_H
      const cx = x + FRAME_W / 2
      const cy = y + FRAME_H / 2
      ctx.fillStyle = ((f + d) % 2 === 0) ? '#0f172a' : '#111827'
      ctx.fillRect(x, y, FRAME_W, FRAME_H)

      const bounce = Math.sin((f / FRAMES) * Math.PI * 2) * 4
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(cx, cy + bounce, 22, 0, Math.PI * 2)
      ctx.fill()

      ctx.save()
      ctx.translate(cx, cy + bounce)
      ctx.rotate(angle)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.moveTo(0, -14)
      ctx.lineTo(10, 10)
      ctx.lineTo(0, 5)
      ctx.lineTo(-10, 10)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }
  }

  fs.writeFileSync(path.join(outDir, `${id}.png`), canvas.toBuffer('image/png'))
  fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify({
    id,
    path: `/assets/${path.basename(outDir)}/${id}.png`,
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    directions: DIRS,
    anchorX: 0.5,
    anchorY: 0.75,
    animations: { walk: { row: 0, frames: FRAMES, speed: 0.2 } },
  }, null, 2))
  console.log(`rendered: ${id} -> ${outDir}`)
}

async function main() {
  const args = process.argv.slice(2)
  const inputDir = args[0] ?? path.resolve(process.cwd(), 'raw-art/units')
  const outputDir = args[1] ?? path.resolve(process.cwd(), 'public/assets/units')
  if (!fs.existsSync(inputDir)) {
    console.error(`input directory not found: ${inputDir}`)
    process.exit(1)
  }
  fs.mkdirSync(outputDir, { recursive: true })

  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.glb'))
  if (files.length === 0) {
    console.log(`no GLBs in ${inputDir}; nothing to render`)
    return
  }

  const loader = new GLTFLoader()
  for (const file of files) {
    const id = path.basename(file, '.glb')
    const full = path.join(inputDir, file)
    const buffer = fs.readFileSync(full)
    try {
      await new Promise((resolve, reject) => {
        loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '', resolve, reject)
      })
    } catch (e) {
      console.error(`failed to parse ${file}:`, e)
      continue
    }
    // TODO: real three.js orbit render once a headless WebGL backend is wired
    buildFallbackSheet(id, outputDir)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
