interface GridBackgroundProps {
  /** grid cell size in px */
  size?: number
  /** line color (keep very low alpha for elegance) */
  lineColor?: string
}

/**
 * Subtle, elegant grid-lines background. Uses `background-attachment: fixed`
 * so the grid stays put while content scrolls over it — a clean parallax.
 * Render inside a `position: relative` wrapper; sits behind the content.
 */
export default function GridBackground({
  size = 38,
  lineColor = 'rgba(212,161,60,0.06)',
}: GridBackgroundProps) {
  return (
    <div
      aria-hidden
      className="tr-grid-bg"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: `linear-gradient(${lineColor} 1px, transparent 1px), linear-gradient(90deg, ${lineColor} 1px, transparent 1px)`,
        backgroundSize: `${size}px ${size}px`,
        backgroundAttachment: 'fixed',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, #000 6%, #000 94%, transparent)',
        maskImage: 'linear-gradient(to bottom, transparent, #000 6%, #000 94%, transparent)',
      }}
    />
  )
}
