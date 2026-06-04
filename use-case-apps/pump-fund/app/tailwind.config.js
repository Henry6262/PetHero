/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Bone-white editorial canvas
        paper: '#F2F0EA',
        'paper-deep': '#E7E3D9',
        card: '#FBFAF6',
        // Deep ink
        ink: '#11151C',
        'ink-soft': '#525a64',
        'ink-faint': '#9097a0',
        // Electric blue — the single accent
        blue: {
          DEFAULT: '#1D4ED8',
          bright: '#2563EB',
          deep: '#1E3A8A',
          wash: '#E6ECFB',
        },
        sky: '#93C5FD',
        line: 'rgba(17,21,28,0.10)',
        'line-strong': 'rgba(17,21,28,0.16)',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Spline Sans Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(17,21,28,0.04), 0 14px 36px rgba(17,21,28,0.07)',
        lift: '0 10px 22px rgba(17,21,28,0.09), 0 34px 70px rgba(17,21,28,0.14)',
        blue: '0 12px 34px rgba(29,78,216,0.30)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(22px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(-1.5deg)' },
          '50%': { transform: 'translateY(-14px) rotate(-1.5deg)' },
        },
        'float-tag': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.9s ease both',
        float: 'float 7s ease-in-out infinite',
        'float-tag': 'float-tag 4s ease-in-out infinite',
        marquee: 'marquee 34s linear infinite',
        'pulse-ring': 'pulse-ring 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
};
