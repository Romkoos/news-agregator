import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf2f2',
          400: '#d06868',
          500: '#BF4646',
          600: '#a33b3b',
          700: '#8a3232',
          900: '#3d1616',
        },
        surface:    '#EDDCC6',
        background: '#FFF4EA',
        secondary:  '#7EACB5',
      },
    },
  },
  plugins: [],
} satisfies Config
