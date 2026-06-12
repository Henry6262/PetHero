/** Shared brand tokens for Trench Wars UI. Keep this the single source of truth for colors, fonts, and copy. */
export const BRAND = {
  name: 'TRENCH WARS',
  tagline: 'Traders vs Jeets',
  fonts: {
    header: '"Orbitron", sans-serif',
    body: '"Rajdhani", monospace',
    fallback: 'monospace',
  },
  colors: {
    bg: 0x0a0e14,
    panel: 0x141b2d,
    panelLight: 0x1e2942,
    panelBorder: 0x2a3a5e,
    panelBorderLight: 0x4b6aa6,
    primary: 0xf5e600,
    primaryDark: 0xc9b800,
    attacker: 0x2bff88,
    attackerDark: 0x1bb85f,
    defender: 0xff4d5e,
    defenderDark: 0xc93645,
    elixir: 0xb44dff,
    elixirDark: 0x7a2db3,
    text: '#e6f0ff',
    textMuted: '#9fb3c8',
    textDark: '#5a6a85',
    white: '#ffffff',
  },
}

export function hexToCss(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`
}

export function cssToHex(css: string): number {
  const s = css.replace('#', '')
  return parseInt(s, 16)
}
