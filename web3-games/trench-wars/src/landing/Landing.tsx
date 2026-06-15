import { useEffect } from 'react'
import Lenis from 'lenis'
import { useScrollReveal } from './useScrollReveal'
import { Nav } from './sections/Nav'
import { Hero } from './sections/Hero'
import { Roster } from './sections/Roster'
import { HowItWorks } from './sections/HowItWorks'
import { Mechanics } from './sections/Mechanics'
import { TokenEconomy } from './sections/TokenEconomy'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'

interface LandingProps {
  onEnter: () => void
}

export function Landing({ onEnter }: LandingProps) {
  useScrollReveal()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    const id = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(id)
      lenis.destroy()
    }
  }, [])

  return (
    <div className="tr-landing">
      <Nav onPlay={onEnter} />
      <Hero />
      <Roster />
      <HowItWorks />
      <Mechanics />
      <TokenEconomy />
      <FinalCta onPlay={onEnter} />
      <Footer />
    </div>
  )
}
