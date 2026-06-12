import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

/**
 * Renders transparent-background card portraits from the character GLBs in
 * public/assets/3d/chars/. One render + one canvas readback per character —
 * well under this machine's ~16-readback headless GPU limit.
 *
 * Usage: npx tsx scripts/render-portraits.ts [name ...]   (default: all chars)
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public/assets/3d/portraits')

const MIME: Record<string, string> = {
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.png': 'image/png', '.html': 'text/html',
}

function createStaticServer(): http.Server {
  return http.createServer((req, res) => {
    const url = (req.url || '/').split('?')[0]
    const file = path.join(ROOT, decodeURIComponent(url))
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404); res.end(); return
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
}

const PAGE = `<!doctype html><html><body><script type="importmap">
{ "imports": {
  "three": "/node_modules/three/build/three.module.js",
  "three/addons/": "/node_modules/three/examples/jsm/"
} }
</script><script type="module">
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
renderer.setSize(512, 512)
renderer.setClearColor(0x000000, 0)
renderer.outputColorSpace = THREE.SRGBColorSpace
const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder)

window.renderPortrait = async (name) => {
  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xffffff, 0x555566, 1.6))
  const key = new THREE.DirectionalLight(0xfff2d9, 2.4)
  key.position.set(2, 4, 5)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x88bbff, 1.2)
  rim.position.set(-3, 2, -4)
  scene.add(rim)

  const glb = await loader.loadAsync('/public/assets/3d/chars/' + name + '-walk.glb')
  const model = glb.scene
  scene.add(model)
  // pose mid-stride instead of T-pose
  if (glb.animations.length) {
    const mixer = new THREE.AnimationMixer(model)
    mixer.clipAction(glb.animations[0]).play()
    mixer.update(0.38)
  }
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 100)
  const dist = size.y * 2.3
  cam.position.set(center.x + dist * 0.4, center.y + size.y * 0.2, center.z + dist * 0.95)
  cam.lookAt(center.x, center.y, center.z)
  renderer.render(scene, cam)
  return renderer.domElement.toDataURL('image/png')
}
window.__READY__ = true
</script></body></html>`

async function main() {
  const chars = process.argv.slice(2).length
    ? process.argv.slice(2)
    : [...new Set(fs.readdirSync(path.join(ROOT, 'public/assets/3d/chars'))
        .filter((f) => f.endsWith('-walk.glb'))
        .map((f) => f.replace('-walk.glb', '')))]

  const server = createStaticServer()
  await new Promise<void>((r) => server.listen(0, r))
  const port = (server.address() as { port: number }).port

  const browser = await chromium.launch({ args: ['--use-gl=angle'] })
  const page = await browser.newPage()
  await page.goto(`http://localhost:${port}/public/index.html`).catch(() => {})
  await page.setContent(PAGE.replace(/\/node_modules/g, `http://localhost:${port}/node_modules`)
    .replace(/\/public/g, `http://localhost:${port}/public`), { waitUntil: 'load' })
  await page.waitForFunction(() => (window as any).__READY__, undefined, { timeout: 15000 })

  fs.mkdirSync(OUT_DIR, { recursive: true })
  for (const name of chars) {
    const dataUrl = await page.evaluate((n) => (window as any).renderPortrait(n), name)
    const png = Buffer.from(dataUrl.split(',')[1], 'base64')
    fs.writeFileSync(path.join(OUT_DIR, `${name}.png`), png)
    console.log(`portrait: ${name}.png (${(png.length / 1024).toFixed(0)}KB)`)
  }

  await browser.close()
  server.close()
}

main().catch((e) => { console.error(e); process.exit(1) })
