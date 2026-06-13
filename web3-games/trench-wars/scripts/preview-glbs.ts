import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

/** Render a contact sheet of arbitrary character GLBs to eyeball them. Pass a dir of .glb files. */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SRC_DIR = process.argv[2] || '/tmp/tw-candidates'
const OUT = process.argv[3] || '/tmp/tw-preview.png'

const MIME: Record<string, string> = {
  '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.html': 'text/html', '.wasm': 'application/wasm',
}

function server(): http.Server {
  return http.createServer((req, res) => {
    let url = decodeURIComponent((req.url || '/').split('?')[0])
    let file = url.startsWith('/cand/') ? path.join(SRC_DIR, url.slice(6)) : path.join(ROOT, url)
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
    fs.createReadStream(file).pipe(res)
  })
}

async function main() {
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.glb')).sort()
  const srv = server()
  await new Promise<void>((r) => srv.listen(0, r))
  const port = (srv.address() as { port: number }).port

  const cols = 4
  const cell = 300
  const rows = Math.ceil(files.length / cols)
  const html = `<!doctype html><html><head><style>
    body{margin:0;background:#0a0e14;display:grid;grid-template-columns:repeat(${cols},${cell}px);}
    .cell{width:${cell}px;height:${cell}px;position:relative;}
    .cell canvas{width:100%;height:100%;}
    .lbl{position:absolute;bottom:4px;left:0;right:0;text-align:center;color:#f5e600;font:700 14px monospace;text-shadow:0 1px 3px #000;}
  </style>
  <script type="importmap">{"imports":{"three":"http://localhost:${port}/node_modules/three/build/three.module.js","three/addons/":"http://localhost:${port}/node_modules/three/examples/jsm/"}}</script>
  </head><body>
  <script type="module">
  import * as THREE from 'three'
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
  import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
  const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder)
  const files = ${JSON.stringify(files)}
  for (const name of files) {
    const cellDiv = document.createElement('div'); cellDiv.className='cell'
    const lbl = document.createElement('div'); lbl.className='lbl'; lbl.textContent=name.replace('.glb','')
    document.body.appendChild(cellDiv); cellDiv.appendChild(lbl)
    const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true})
    renderer.setSize(${cell},${cell}); renderer.outputColorSpace = THREE.SRGBColorSpace
    cellDiv.insertBefore(renderer.domElement, lbl)
    const scene = new THREE.Scene()
    scene.add(new THREE.HemisphereLight(0xffffff,0x444455,1.6))
    const d = new THREE.DirectionalLight(0xfff2d9,2.2); d.position.set(2,4,5); scene.add(d)
    try {
      const glb = await loader.loadAsync('http://localhost:${port}/cand/'+name)
      scene.add(glb.scene)
      const box = new THREE.Box3().setFromObject(glb.scene)
      const size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3())
      const cam = new THREE.PerspectiveCamera(35,1,0.01,100)
      const dist = Math.max(size.x,size.y,size.z)*1.9
      cam.position.set(ctr.x+dist*0.35, ctr.y+size.y*0.1, ctr.z+dist)
      cam.lookAt(ctr.x,ctr.y,ctr.z); renderer.render(scene,cam)
    } catch(e) { lbl.textContent = name+' ERR' }
  }
  window.__DONE__ = true
  </script></body></html>`

  const browser = await chromium.launch({ args: ['--use-gl=angle'] })
  const page = await browser.newPage({ viewport: { width: cols * cell, height: rows * cell } })
  page.on('pageerror', (e) => console.log('ERR', e.message.slice(0, 120)))
  await page.setContent(html, { waitUntil: 'load' })
  await page.waitForFunction(() => (window as any).__DONE__, undefined, { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.screenshot({ path: OUT })
  console.log('saved', OUT)
  await browser.close(); srv.close()
}
main().catch((e) => { console.error(e); process.exit(1) })
