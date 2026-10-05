import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        gold: '#0E4C92',
        paper: '#FFFFFF',
        sand: '#FFFFFF',
        graphite: '#000000',
        line: '#000000'
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        soft: '0 18px 55px rgba(0,0,0,.14)',
        gold: '0 10px 32px rgba(0,0,0,.22)'
      },
      borderRadius: { xl2: '1.25rem' }
    }
  },
  plugins: []
} satisfies Config
