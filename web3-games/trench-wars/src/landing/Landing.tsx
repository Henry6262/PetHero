import { Hero } from './sections/Hero'

export function Landing({ onBuildDeck }: { onBuildDeck: () => void }) {
  return (
    <div className="tr-landing">
      <Hero onBuildDeck={onBuildDeck} />
    </div>
  )
}
