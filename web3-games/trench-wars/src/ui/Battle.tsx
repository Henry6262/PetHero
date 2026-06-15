import { useEffect, useMemo, useRef, useState } from 'react'
import { BattleController, ELIXIR_MAX } from '../game/BattleController'
import type { BattleSnapshot } from '../game/BattleController'
import { getCard } from '../sim/cards'
import { CARD_CHAR } from '../render3d/Battle3D'
import { CardTile } from './CardTile'
import { Icon } from './Icon'
import { TutorialGuide } from './TutorialGuide'
import type { Screen } from './Screen'

interface Props {
  screen: Extract<Screen, { name: 'battle' }>
  go: (s: Screen) => void
  tutorial?: boolean
}

const TUTORIAL_STEPS = [
  { text: 'Drag a card from your hand onto your side of the trench.' },
  { text: 'Destroy both enemy towers before the timer runs out.' },
  { text: 'Elixir refills automatically — spend it wisely.' },
]

const LOADING_TIPS = [
  'Lure troops to your side of the trench to engage them with your towers.',
  'Cheap swarm cards counter single-target heavy hitters.',
  'Save your spells for clustered enemy troops.',
  'A balanced deck has cheap cycle cards and a heavy win condition.',
  'Elixir leaks when you sit at 10 — keep spending.',
]

function BattleLoading() {
  const tip = useMemo(() => LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)], [])
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setProgress((p) => Math.min(100, p + Math.random() * 12 + 4)), 120)
    return () => clearInterval(id)
  }, [])
  const portrait = '/assets/3d/portraits/vanguard.png'
  return (
    <div className="battle-loading">
      <div className="battle-loading-bg" style={{ backgroundImage: `url(${portrait})` }} />
      <div className="battle-loading-vignette" />
      <div className="battle-loading-content">
        <div className="battle-loading-title">RAISING THE TRENCH</div>
        <div className="battle-loading-bar">
          <div className="battle-loading-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="battle-loading-tip">{tip}</div>
      </div>
    </div>
  )
}

export function Battle({ screen, go, tutorial }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const ctrlRef = useRef<BattleController | null>(null)
  const [snap, setSnap] = useState<BattleSnapshot | null>(null)
  const [tutorialStep, setTutorialStep] = useState(0)

  useEffect(() => {
    if (!tutorial) return
    if (!snap) return
    if (tutorialStep === 0 && snap.hasDeployed) {
      setTutorialStep(1)
      const t = setTimeout(() => setTutorialStep(2), 5000)
      return () => clearTimeout(t)
    }
  }, [snap, tutorial, tutorialStep])

  useEffect(() => {
    const ctrl = new BattleController({
      mode: screen.mode,
      defenderId: screen.defenderId,
      defenderDeck: screen.defenderDeck,
      stage: stageRef.current!,
      overlay: overlayRef.current!,
      onSnapshot: setSnap,
    })
    ctrlRef.current = ctrl
    ;(window as any).__TRENCH_READY__ = true
    return () => ctrl.dispose()
  }, [])

  const ctrl = ctrlRef.current
  const result = snap?.result ?? null
  const isWin = result?.winner === 0
  const isLoss = result?.winner === 1
  const showGuide = tutorial && snap?.ready && !result && tutorialStep < TUTORIAL_STEPS.length

  const friendlyTowers = snap?.towers.filter((t) => t.owner === 0) ?? []
  const enemyTowers = snap?.towers.filter((t) => t.owner === 1) ?? []

  return (
    <div className="battle-screen">
      <div className="battle-frame">
        <div
          ref={stageRef}
          className="stage"
          onPointerDown={(e) => ctrl?.onStageClick(e.clientX, e.clientY)}
        >
          <canvas ref={overlayRef} className="overlay" />
          {!snap?.ready && <BattleLoading />}

          {snap?.ready && (
            <div className="top-bar">
              <div className="tower-panel enemy">
                <div className="tower-crowns">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={i < (snap?.enemyCrowns ?? 0) ? 'won' : ''}><Icon name="crown" size={14} /></span>
                  ))}
                </div>
                <div className="tower-bars">
                  {enemyTowers.map((t, i) => (
                    <div key={i} className="tower-bar">
                      <div className="tower-fill" style={{ width: `${(t.hp / t.maxHp) * 100}%` }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="match-timer">
                <div className="timer-label">{snap.mode === 'ladder' ? 'RANKED' : snap.levelName}</div>
                <div className="timer-value">{snap.timeText}</div>
              </div>

              <div className="tower-panel friendly">
                <div className="tower-bars">
                  {friendlyTowers.map((t, i) => (
                    <div key={i} className="tower-bar">
                      <div className="tower-fill" style={{ width: `${(t.hp / t.maxHp) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className="tower-crowns">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={i < (snap?.crowns ?? 0) ? 'won' : ''}><Icon name="crown" size={14} /></span>
                  ))}
                </div>
              </div>

              <button
                className="mute-btn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => ctrl?.toggleMute()}
              >
                {snap.muted ? <Icon name="lock" size={12} /> : <Icon name="elixir" size={12} />}
                {snap.muted ? 'OFF' : 'ON'}
              </button>
            </div>
          )}

          {showGuide && (
            <TutorialGuide
              steps={TUTORIAL_STEPS.slice(tutorialStep)}
              onComplete={() => setTutorialStep(TUTORIAL_STEPS.length)}
              startVisible
            />
          )}

          {result && (
            <div className="result-overlay">
              <div className={`result-panel ${isWin ? 'win' : isLoss ? 'loss' : 'draw'}`}>
                <div className="result-crown"><Icon name="crown" size={64} /></div>
                <h2>{isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'}</h2>
                <div className="reason">{result.reason.toUpperCase()}</div>
                <div className="hint">
                  <button className="btn primary" onPointerDown={(e) => e.stopPropagation()} onClick={() => ctrl?.restart()}>
                    PLAY AGAIN
                  </button>
                  <button className="btn" onPointerDown={(e) => e.stopPropagation()} onClick={() => go({ name: 'menu' })}>
                    MENU
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hud">
          <div className="elixir-row">
            <div className="elixir-label"><Icon name="elixir" size={14} /></div>
            <div className={`elixir-bar ${snap && snap.elixir >= ELIXIR_MAX ? 'full' : ''}`}>
              <div className="elixir-fill" style={{ width: `${((snap?.elixir ?? 0) / ELIXIR_MAX) * 100}%` }} />
              <div className="elixir-ticks">
                {Array.from({ length: ELIXIR_MAX }, (_, i) => <i key={i} />)}
              </div>
            </div>
            <div className="elixir-num">{Math.floor(snap?.elixir ?? 0)}</div>
            {snap?.next && (
              <div className="next-hint">
                NEXT
                {CARD_CHAR[snap.next]
                  ? <img src={`/assets/3d/portraits/${CARD_CHAR[snap.next]}.png`} alt="" />
                  : <Icon name="spell" size={20} />}
                {getCard(snap.next).name.toUpperCase().slice(0, 12)}
              </div>
            )}
          </div>
          <div className="hand">
            {(snap?.hand ?? []).map((id, i) => (
              <CardTile
                key={`${id}-${i}`}
                cardId={id}
                className={[
                  i === snap?.selected ? 'selected' : '',
                  (snap?.elixir ?? 0) < getCard(id).cost ? 'broke' : '',
                ].join(' ')}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  ctrlRef.current?.beginDrag(i)
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
