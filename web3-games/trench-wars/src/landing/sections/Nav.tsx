import { useEffect, useState } from 'react'
import { TOKEN } from '../data'

interface NavProps {
  onPlay: () => void
}

const LINKS = [
  ['Roster', 'roster'],
  ['How It Works', 'how'],
  ['Mechanics', 'mechanics'],
] as const

const DEXSCREENER_URL = `https://dexscreener.com/solana/${TOKEN.mint}`

export function Nav({ onPlay }: NavProps) {
  const [solid, setSolid] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > 40)
      // hide the menu when scrolling down (past the hero), reveal when scrolling up
      if (y > 90 && y > last + 4) setHidden(true)
      else if (y < last - 4) setHidden(false)
      last = y
    }
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
      {/* DexScreener token button — left side */}
      <a
        href={DEXSCREENER_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 10,
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          color: '#4ade80',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '0.06em',
          textDecoration: 'none',
          textTransform: 'uppercase',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(34, 197, 94, 0.22)'
          e.currentTarget.style.boxShadow = '0 0 20px rgba(34, 197, 94, 0.25)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(34, 197, 94, 0.12)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <span>Screener</span>
      </a>

      {/* Centered glassmorphic crown emblem */}
      <a
        href="#"
        aria-label="Trench Royale"
        style={{
          position: 'absolute',
          left: '50%',
          top: '136%',
          transform: 'translate(-50%, -50%)',
          width: 152,
          height: 152,
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.06)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'
        }}
      >
        <img
          src="/assets/brand/crown.png"
          alt="Trench Royale"
          style={{
            width: 94,
            height: 94,
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      </a>

      <div
        className="tr-nav-links"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 28,
          opacity: hidden ? 0 : 1,
          transform: hidden ? 'translateY(-14px)' : 'translateY(0)',
          pointerEvents: hidden ? 'none' : 'auto',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      >
        {LINKS.map(([label, id]) => (
          <a
            key={id}
            href={`#${id}`}
            style={{
              color: 'var(--color-muted)',
              fontSize: 16,
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
            fontSize: 15,
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
