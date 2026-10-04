import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0D0D0D',
        gold: '#D4AF37',
        paper: '#FAF8F3',
        sand: '#F1EBDD',
        graphite: '#666158',
        line: '#E7DFD1'
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        soft: '0 18px 55px rgba(13,13,13,.08)',
        gold: '0 10px 32px rgba(212,175,55,.18)'
      },
      borderRadius: { xl2: '1.25rem' }
    }
  },
  plugins: []
} satisfies Config
