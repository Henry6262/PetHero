import { useEffect, useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface Props {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
  y?: number
  delay?: number
  duration?: number
}

export function ScrollReveal({ children, className = '', style, y = 40, delay = 0, duration = 0.8 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from(el, {
        opacity: 0,
        y,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      })
    }, el)

    return () => ctx.revert()
  }, [y, delay, duration])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
