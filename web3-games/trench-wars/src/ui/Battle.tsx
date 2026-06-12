import { useEffect, useRef, useState } from 'react'
import { BattleController, ELIXIR_MAX } from '../game/BattleController'
import type { BattleSnapshot } from '../game/BattleController'
import { getCard } from '../sim/cards'
import { CARD_CHAR } from '../render3d/Battle3D'
import { CardTile } from './CardTile'
import type { Screen } from './App'

interface Props {
  screen: Extract<Screen, { name: 'battle' }>
  go: (s: Screen) => void
}

export function Battle({ screen, go }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const ctrlRef = useRef<BattleController | null>(null)
  const [snap, setSnap] = useState<BattleSnapshot | null>(null)

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

  return (
    <div className="battle-screen">
      <div className="battle-frame">
        <div
          ref={stageRef}
          className="stage"
          onPointerDown={(e) => ctrl?.onStageClick(e.clientX, e.clientY)}
        >
          <canvas ref={overlayRef} className="overlay" />
          {!snap?.ready && <div className="loading">RAISING THE BATTLEFIELD…</div>}

          {snap?.ready && (
            <div className="top-bar">
              <div className="crowns">
                {[0, 1, 2].map((i) => (
                  <span key={i} className={i < (snap?.crowns ?? 0) ? 'won' : ''}>♛</span>
                ))}
              </div>
              <div className="match-label">
                {snap.mode === 'ladder' ? 'RANKED' : snap.levelName} · {snap.timeText}
              </div>
              <button
                className="mute-btn"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => ctrl?.toggleMute()}
              >
                {snap.muted ? 'SOUND OFF' : 'SOUND ON'}
              </button>
            </div>
          )}

          {result && (
            <div className="result-overlay">
              <div className="result-panel">
                <h2 className={isWin ? 'win' : isLoss ? 'loss' : ''}>
                  {isWin ? 'VICTORY' : isLoss ? 'DEFEAT' : 'DRAW'}
                </h2>
                <div className="reason">by {result.reason.toUpperCase()}</div>
                <div className="hint" style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center' }}>
                  <button className="btn primary" style={{ padding: '10px 18px', maxWidth: 170 }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => ctrl?.restart()}>
                    PLAY AGAIN
                  </button>
                  <button className="btn" style={{ padding: '10px 18px', maxWidth: 170 }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => go({ name: 'menu' })}>
                    MENU
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hud">
          <div className="elixir-row">
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
                  : <span>✦</span>}
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
