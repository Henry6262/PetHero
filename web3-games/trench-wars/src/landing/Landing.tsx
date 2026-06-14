import { Hero } from './sections/Hero'

export function Landing({ onPlay }: { onPlay: () => void }) {
  return (
    <div className="tr-landing">
      <Hero onPlay={onPlay} />
    </div>
  )
}
