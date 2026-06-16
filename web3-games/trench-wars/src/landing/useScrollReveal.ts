import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollReveal(rootSelector = '.tr-landing section') {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(rootSelector).forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0.85, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        )

        const reveals = el.querySelectorAll<HTMLElement>('.reveal')
        if (reveals.length > 0) {
          gsap.fromTo(
            reveals,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 80%',
                toggleActions: 'play none none none',
              },
            }
          )
        }
      })
    })

    // Ensure ScrollTrigger recalculates after Lenis (or any lazy images) settle.
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200)

    return () => {
      clearTimeout(refreshTimer)
      ctx.revert()
    }
  }, [rootSelector])
}
