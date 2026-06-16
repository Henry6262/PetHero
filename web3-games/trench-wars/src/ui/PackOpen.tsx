import { useState } from 'react'
import { TrenchCard } from './TrenchCard'
import { rarityOf, rarityColor } from './rarity'
import { CARD_PORTRAIT } from '../render3d/Battle3D'
import ChromaCard from './reactbits/ChromaCard'
import Crate3D from './Crate3D'
import { chestForTier, type ChestTier } from './crates'

const CARD_W = 300
const CARD_H = 400

type Phase = 'idle' | 'charging' | 'revealing' | 'summary'

interface Props {
  cardIds: string[]
  onDone: () => void
  tier?: ChestTier
}

export function PackOpen({ cardIds, onDone, tier = 'rug' }: Props) {
  const chest = chestForTier(tier)
  const [phase, setPhase] = useState<Phase>('idle')
  const [index, setIndex] = useState(0)
  const [rays, setRays] = useState(false)
  const [flash, setFlash] = useState(false)

  const fireBurst = () => {
    setFlash(true); setRays(true)
    setTimeout(() => { setFlash(false); setRays(false) }, 1100)
  }

  const open = () => {
    if (phase !== 'idle') return
    setPhase('charging')
    setTimeout(() => { fireBurst(); setPhase('revealing') }, 900)
  }

  const next = () => {
    if (index + 1 >= cardIds.length) { setPhase('summary'); return }
    const ni = index + 1
    setIndex(ni)
    const r = rarityOf(cardIds[ni])
    if (r === 'epic' || r === 'legendary') fireBurst()
  }

  const current = cardIds[index]
  const rayColor = current ? rarityColor(rarityOf(current)) : '#fff'
  const portrait = current ? (CARD_PORTRAIT[current] ?? 'explorer') : 'explorer'
  const rayColorHex = `${rayColor}55`

  return (
    <div className="packopen">
      <div className={`pack-rays ${rays ? 'show' : ''}`} style={{ ['--ray' as any]: rayColorHex }} />
      <div className={`pack-flash ${flash ? 'fire' : ''}`} />

      {phase !== 'revealing' && phase !== 'summary' && (
        <div className="pack-crate-stage">
          <Crate3D src={chest.url} size={320} open={phase === 'charging'} glow={chest.glow} />
          {phase === 'idle' && (
            <button className="pack-crate-hit" onClick={open}>
              OPEN {chest.name.toUpperCase()}
            </button>
          )}
        </div>
      )}

      {phase === 'revealing' && current && (
        <div className="pack-reveal" onClick={next}>
          <div className="pack-card-flip" key={current}>
            <div style={{ position: 'relative', width: CARD_W, height: CARD_H }}>
              <ChromaCard width={CARD_W} height={CARD_H} imageSrc={`/assets/3d/portraits/${portrait}.png`} imageAspectRatio={1} opacity={0.85}>
                <TrenchCard cardId={current} size="xl" showRibbon />
              </ChromaCard>
            </div>
          </div>
          <div className="pack-progress">{index + 1} / {cardIds.length} — TAP FOR NEXT</div>
        </div>
      )}

      {phase === 'summary' && (
        <>
          <div className="pack-summary">
            {cardIds.map((id, i) => <TrenchCard key={`${id}-${i}`} cardId={id} size="md" />)}
          </div>
          <button className="btn primary pack-continue" onClick={onDone}>CONTINUE</button>
        </>
      )}
    </div>
  )
}
