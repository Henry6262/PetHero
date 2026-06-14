import { useState } from 'react'

export interface TutorialStep {
  text: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  action?: string
}

interface Props {
  steps: TutorialStep[]
  onComplete: () => void
  avatar?: string
  name?: string
  startVisible?: boolean
}

const DEFAULT_AVATAR = '/assets/3d/portraits/vanguard.png'

export function TutorialGuide({
  steps,
  onComplete,
  avatar = DEFAULT_AVATAR,
  name = 'VANGUARD',
  startVisible = true,
}: Props) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(startVisible)

  if (!visible) return null
  if (steps.length === 0) return null

  const current = steps[step]
  const isLast = step === steps.length - 1
  const position = current.position ?? 'top'

  const advance = () => {
    if (isLast) {
      setVisible(false)
      onComplete()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <div className="tutorial-guide">
      <div className={`tutorial-guide-avatar pos-${position}`}>
        <img src={avatar} alt={name} />
        <span className="guide-name">{name}</span>
      </div>
      <div className={`tutorial-bubble pos-${position}`}>
        <div className="tutorial-bubble-text">{current.text}</div>
        <div className="tutorial-bubble-footer">
          <span className="tutorial-step-count">
            {step + 1} / {steps.length}
          </span>
          <button className="tutorial-next-btn" onClick={advance}>
            {current.action ?? (isLast ? 'GOT IT' : 'NEXT')}
          </button>
        </div>
      </div>
    </div>
  )
}
