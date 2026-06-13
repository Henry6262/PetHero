// Bake portfolio character GLBs into the game's <name>-walk.glb / <name>-attack.glb format,
// keeping exactly one animation per file and meshopt-compressing to web size.
// Run from the trench-wars dir: node scripts/bake-characters.mjs
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { prune, dedup, meshopt } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import path from 'node:path'

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder })

const GROOT = '/Users/henry/Documents/Gazillion-dollars'
const OUT = path.join(GROOT, 'web3-games/trench-wars/public/assets/3d/chars')

/** Keep only the animation whose name matches `keep` (substring, case-insensitive); rename it to `as`. */
async function bake(srcPath, keep, as, outName) {
  const doc = await io.read(srcPath)
  const root = doc.getRoot()
  const anims = root.listAnimations()
  const match = anims.find((a) => a.getName().toLowerCase().includes(keep.toLowerCase()))
  if (!match) throw new Error(`no animation matching "${keep}" in ${srcPath} (have: ${anims.map((a) => a.getName())})`)
  for (const a of anims) if (a !== match) a.dispose()
  match.setName(as)
  await doc.transform(dedup(), prune(), meshopt({ encoder: MeshoptEncoder, level: 'high' }))
  await io.write(path.join(OUT, outName), doc)
  const size = (await io.writeBinary(doc)).byteLength
  console.log(`${outName}: ${(size / 1024).toFixed(0)}KB  (${as} from "${match.getName()}")`)
}

const MESHY = (char, anim) =>
  path.join(GROOT, `pokedex-landing/_incoming/${char}/Meshy_AI_biped_Animation_${anim}_withSkin.glb`)
const ULT = (n) =>
  path.join(GROOT, `web3-games/Web3-Poker/public/assets/optimized/characters-ultimatum/ultimatum-${n}-anims.glb`)

// newbiped (fiery phoenix) — full Meshy rig
await bake(MESHY('Meshy_AI_biped 2', 'Walking'), 'walk', 'walk', 'phoenix-walk.glb')
await bake(MESHY('Meshy_AI_biped 2', 'Boxing_Guard_Prep_Straight_Punch'), 'boxing', 'attack', 'phoenix-attack.glb')

// ultimatum trio — split Walking / Running out of the multi-clip rig
for (const [n, name] of [[1, 'pepe'], [2, 'bluemob'], [3, 'degen']]) {
  await bake(ULT(n), 'walking', 'walk', `${name}-walk.glb`)
  await bake(ULT(n), 'running', 'attack', `${name}-attack.glb`)
}

console.log('done')
