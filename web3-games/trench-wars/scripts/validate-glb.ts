import fs from 'node:fs'
import path from 'node:path'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FileLoader } from 'three/src/loaders/FileLoader.js'
import type { Group } from 'three'

interface Report {
  file: string
  ok: boolean
  errors: string[]
  triCount: number
  nodeNames: string[]
}

const REQUIRED_UNIT_NODES = ['body']
const MAX_TRIS = 15000

function countTris(group: Group): number {
  let n = 0
  group.traverse((obj: any) => {
    if (obj.isMesh && obj.geometry && obj.geometry.index) {
      n += obj.geometry.index.count / 3
    } else if (obj.isMesh && obj.geometry && obj.geometry.attributes.position) {
      n += obj.geometry.attributes.position.count / 3
    }
  })
  return Math.floor(n)
}

function collectNodeNames(group: Group): string[] {
  const names: string[] = []
  group.traverse((obj: any) => { if (obj.name) names.push(obj.name) })
  return names
}

async function validateReport(file: string, group: Group, isUnit: boolean): Promise<Report> {
  const errors: string[] = []
  const triCount = countTris(group)
  const nodeNames = collectNodeNames(group)

  if (triCount > MAX_TRIS) errors.push(`too many triangles (${triCount} > ${MAX_TRIS})`)
  if (isUnit) {
    for (const n of REQUIRED_UNIT_NODES) {
      if (!nodeNames.includes(n)) errors.push(`missing required node: ${n}`)
    }
  }

  // origin at ground center sanity: bounding box center x/z near 0, bottom y near 0
  const { Box3 } = await import('three')
  const box = new Box3().setFromObject(group)
  if (Math.abs((box.max.x + box.min.x) / 2) > 0.2) errors.push('origin not centered on X axis')
  if (Math.abs(box.min.y) > 0.2) errors.push('origin not at ground level (Y)')

  return { file, ok: errors.length === 0, errors, triCount, nodeNames }
}

async function main() {
  const args = process.argv.slice(2)
  const root = args[0] ?? path.resolve(process.cwd(), 'raw-art')
  if (!fs.existsSync(root)) {
    console.error(`raw-art root not found: ${root}`)
    process.exit(1)
  }

  const loader = new GLTFLoader()
  const reports: Report[] = []

  for (const kind of ['units', 'towers']) {
    const dir = path.join(root, kind)
    if (!fs.existsSync(dir)) continue
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.glb'))) {
      const full = path.join(dir, file)
      const buffer = fs.readFileSync(full)
      const gltf = await new Promise<any>((resolve, reject) => {
        loader.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), '', resolve, reject)
      })
      const report = await validateReport(full, gltf.scene, kind === 'units')
      reports.push(report)
    }
  }

  let exitCode = 0
  for (const r of reports) {
    console.log(`${r.ok ? '✓' : '✗'} ${r.file} (${r.triCount} tris)`)
    for (const e of r.errors) console.log(`    - ${e}`)
    if (!r.ok) exitCode = 1
  }
  process.exit(exitCode)
}

main().catch(e => { console.error(e); process.exit(1) })
