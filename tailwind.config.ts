import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#12061f',
        purple: { 500: '#6a2fb5', 700: '#3b1670' },
        gold: '#ffc94a',
        orange: '#ff8a3d',
        cream: '#fff6df',
        muted: '#c4b5d3'
      },
      fontFamily: { sans: ['var(--font-body)', 'Arial', 'sans-serif'], arabic: ['var(--font-arabic)', 'sans-serif'] },
      boxShadow: { glow: '0 0 36px rgba(255,201,74,.12)' }
    }
  },
  plugins: []
} satisfies Config;
