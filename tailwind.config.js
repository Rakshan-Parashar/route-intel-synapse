/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0a0c10',
        surface: '#111318',
        panel: '#13161f',
        border: '#1e2130',
        neon: {
          cyan: '#00e5ff',
          pink: '#ff3d71',
          green: '#39ff14',
          amber: '#ffaa00',
          purple: '#b537f2',
          blue: '#0070f3',
        },
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 229, 255, 0.4)',
        'neon-pink': '0 0 15px rgba(255, 61, 113, 0.4)',
        'neon-green': '0 0 15px rgba(57, 255, 20, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(0, 229, 255, 0.6))' },
          '50%': { opacity: '0.6', filter: 'drop-shadow(0 0 2px rgba(0, 229, 255, 0.2))' },
        },
      },
    },
  },
  plugins: [],
}
