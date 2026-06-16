import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

/**
 * Branded loading overlay for the hero 3D scene. Sits absolutely over the
 * canvas and tracks the global GLTF loading manager (drei `useProgress`), so it
 * covers the blank gap while the heavy character/tile GLBs stream in — on both
 * the desktop diorama and the mobile scene. Fades out once assets are ready,
 * with a safety timeout so it can never get stuck.
 */
export function SceneLoader() {
  const { active, progress, loaded, total } = useProgress()
  const [done, setDone] = useState(false)

  // Hide shortly after loading settles (small delay lets the first frame paint).
  useEffect(() => {
    const ready = !active && (progress >= 100 || (total > 0 && loaded >= total))
    if (!ready) return
    const t = setTimeout(() => setDone(true), 500)
    return () => clearTimeout(t)
  }, [active, progress, loaded, total])

  // Safety net: never block the hero forever if a load stalls.
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 12000)
    return () => clearTimeout(t)
  }, [])

  const pct = Math.min(100, Math.round(progress))

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 5,
        display: 'grid',
        placeItems: 'center',
        background:
          'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(15,18,25,0.85), rgba(7,9,13,0.96))',
        opacity: done ? 0 : 1,
        pointerEvents: done ? 'none' : 'auto',
        transition: 'opacity 0.6s ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div
          className="tr-spin"
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            border: '3px solid rgba(212,161,60,0.18)',
            borderTopColor: 'var(--color-gold)',
          }}
        />
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--color-gold)',
          }}
        >
          Entering the trenches
        </div>
        <div style={{ width: 160, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 99,
              background: 'var(--color-gold)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
