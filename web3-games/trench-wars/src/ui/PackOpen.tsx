import { useState } from 'react'
import { TrenchCard } from './TrenchCard'
import { rarityOf, rarityColor } from './rarity'
import { CARD_CHAR } from '../render3d/Battle3D'
import ChromaCard from './reactbits/ChromaCard'
import { Icon } from './Icon'

type Phase = 'idle' | 'charging' | 'revealing' | 'summary'

export function PackOpen({ cardIds, onDone }: { cardIds: string[]; onDone: () => void }) {
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
    setTimeout(() => { fireBurst(); setPhase('revealing') }, 700)
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
  const portrait = current ? (CARD_CHAR[current] ?? 'explorer') : 'explorer'

  return (
    <div className="packopen">
      <div className={`pack-rays ${rays ? 'show' : ''}`} style={{ ['--ray' as any]: `${rayColor}55` }} />
      <div className={`pack-flash ${flash ? 'fire' : ''}`} />

      {phase === 'idle' && (
        <>
          <div className="chest" onClick={open}>
            <div className="chest-glow" />
            <Icon name="loot" size={200} color="var(--primary)" />
          </div>
          <div className="pack-cta">TAP TO OPEN</div>
        </>
      )}

      {phase === 'charging' && (
        <div className="chest charging">
          <div className="chest-glow" />
          <Icon name="loot" size={200} color="var(--primary)" />
        </div>
      )}

      {phase === 'revealing' && current && (
        <div className="pack-reveal" onClick={next}>
          <div className="pack-card-flip" key={current}>
            <div style={{ position: 'relative', width: 200, height: 252 }}>
              <ChromaCard width={200} height={252} imageSrc={`/assets/3d/portraits/${portrait}.png`} imageAspectRatio={1} opacity={0.85}>
                <TrenchCard cardId={current} size="lg" showRibbon />
              </ChromaCard>
            </div>
          </div>
          <div className="pack-progress">{index + 1} / {cardIds.length} — TAP FOR NEXT</div>
        </div>
      )}

      {phase === 'summary' && (
        <>
          <div className="pack-summary">
            {cardIds.map((id, i) => <TrenchCard key={`${id}-${i}`} cardId={id} size="sm" />)}
          </div>
          <button className="btn primary" onClick={onDone}>CONTINUE</button>
        </>
      )}
    </div>
  )
}
