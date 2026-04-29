import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#f9f7f2',
        surface: '#f1ede3',
        border: '#e0dbd0',
        text: '#5a5a5a',
        muted: '#b0aba0',
        dim: '#ccc8be',
        ink: '#1a1a1a',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.18em',
        ultra: '0.3em',
      },
      transitionDuration: {
        '700': '700ms',
        '900': '900ms',
      },
    },
  },
  plugins: [],
}

export default config
