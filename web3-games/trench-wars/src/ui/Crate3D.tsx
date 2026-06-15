import { Component, type ReactNode, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { Icon } from './Icon'

const TILT_X = 0.34

export class R3FBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function CrateModel({ src, open }: { src: string; open: boolean }) {
  const { scene } = useGLTF(src)
  const start = useRef(performance.now())

  const { cloned, lid, lift } = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    const s = 2.0 / maxDim
    c.scale.setScalar(s)
    c.position.copy(center).multiplyScalar(-s)
    const meshes: THREE.Object3D[] = []
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o)
    })
    let top: THREE.Object3D | null = null
    let topY = -Infinity
    const b2 = new THREE.Box3()
    for (const m of meshes) {
      b2.setFromObject(m)
      const cy = (b2.min.y + b2.max.y) / 2
      if (cy > topY) {
        topY = cy
        top = m
      }
    }
    return { cloned: c, lid: top, lift: size.y * 0.45 }
  }, [scene])

  const lidBase = useRef<{ y: number; rx: number } | null>(null)
  useEffect(() => {
    lidBase.current = lid ? { y: lid.position.y, rx: lid.rotation.x } : null
  }, [lid])

  useEffect(() => {
    start.current = performance.now()
  }, [src, open])

  useFrame(() => {
    const t = (performance.now() - start.current) / 1000
    if (!open) {
      cloned.rotation.y = Math.sin(t * 0.5) * 0.3
      cloned.rotation.z = 0
      cloned.position.y = Math.sin(t * 0.8) * 0.04
      if (lid && lidBase.current) {
        lid.position.y = lidBase.current.y
        lid.rotation.x = lidBase.current.rx
      }
      return
    }
    cloned.rotation.y = 0
    cloned.position.y = 0
    if (t < 0.55) {
      cloned.rotation.z = Math.sin(t * 50) * 0.05 * (t / 0.55)
    } else {
      cloned.rotation.z = 0
      const p = Math.min(1, (t - 0.55) / 0.6)
      const e = 1 - Math.pow(1 - p, 3)
      if (lid && lidBase.current) {
        lid.position.y = lidBase.current.y + e * lift
        lid.rotation.x = lidBase.current.rx - e * 1.1
      }
    }
  })

  return (
    <group rotation={[TILT_X, 0, 0]}>
      <primitive object={cloned} />
    </group>
  )
}

function Crate3DCanvas({ src, open, glow }: { src: string; open: boolean; glow: string }) {
  return (
    <Canvas camera={{ position: [0, 0.7, 6.5], fov: 40 }} dpr={[1, 1.5]} gl={{ alpha: true }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 6, 4]} intensity={1.5} />
      <directionalLight position={[-3, 2, -2]} intensity={0.5} />
      <pointLight position={[0, 0.6, 1.5]} intensity={3} color={glow} distance={6} />
      <CrateModel src={src} open={open} />
    </Canvas>
  )
}

function CratePlaceholder({ open, glow }: { open: boolean; glow: string }) {
  return (
    <div className="crate-placeholder" style={{ ['--crate-glow' as any]: glow }}>
      <div className={`crate-box ${open ? 'open' : ''}`}>
        <div className="crate-lid">
          <Icon name="loot" size={42} />
        </div>
        <div className="crate-body">
          <Icon name="loot" size={56} />
        </div>
      </div>
    </div>
  )
}

export default function Crate3D({
  src,
  size = 300,
  open = false,
  glow = '#f5c842',
}: {
  src: string | null
  size?: number
  open?: boolean
  glow?: string
}) {
  if (!src) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: size, display: 'grid', placeItems: 'center' }}>
        <CratePlaceholder open={open} glow={glow} />
      </div>
    )
  }
  return (
    <div style={{ width: '100%', height: '100%', minHeight: size }}>
      <R3FBoundary fallback={<CratePlaceholder open={open} glow={glow} />}>
        <Crate3DCanvas src={src} open={open} glow={glow} />
      </R3FBoundary>
    </div>
  )
}
