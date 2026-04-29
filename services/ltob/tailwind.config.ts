import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0b',
        surface: '#141416',
        border: '#252528',
        accent: '#cf7c51',
        'accent-dim': '#9a5a38',
        text: '#f0ebe4',
        muted: '#6b6b75',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        hand: ['var(--font-caveat)', 'cursive'],
      },
    },
  },
  plugins: [],
}

export default config
