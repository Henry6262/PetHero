import { useEffect, useState } from 'react'

interface NavProps {
  onPlay: () => void
}

const LINKS = [
  ['Roster', 'roster'],
  ['How It Works', 'how'],
  ['Mechanics', 'mechanics'],
  ['Economy', 'economy'],
] as const

export function Nav({ onPlay }: NavProps) {
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px clamp(20px, 4vw, 48px)',
        transition: 'background 0.3s, border-color 0.3s, backdrop-filter 0.3s',
        background: solid ? 'rgba(7,9,13,0.82)' : 'transparent',
        backdropFilter: solid ? 'blur(12px)' : 'blur(2px)',
        borderBottom: `1px solid ${solid ? 'rgba(212,161,60,0.18)' : 'transparent'}`,
      }}
    >
      <a
        href="#"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 900,
          letterSpacing: '0.14em',
          fontSize: 16,
          color: 'var(--color-gold)',
          textTransform: 'uppercase',
          textDecoration: 'none',
        }}
      >
        TRENCH ROYALE
      </a>

      <div
        className="tr-nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
        }}
      >
        {LINKS.map(([label, id]) => (
          <a
            key={id}
            href={`#${id}`}
            style={{
              color: 'var(--color-muted)',
              fontSize: 14,
              textDecoration: 'none',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-gold)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-muted)'
            }}
          >
            {label}
          </a>
        ))}
        <button
          type="button"
          onClick={onPlay}
          style={{
            background: 'var(--color-gold)',
            color: '#07090d',
            border: 'none',
            padding: '10px 22px',
            borderRadius: 10,
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(212,161,60,0.35)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          PLAY
        </button>
      </div>
    </nav>
  )
}
