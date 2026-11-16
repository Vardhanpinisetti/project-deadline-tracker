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
        base: '#05060B',
        ink: '#FFF6EA',
        'ink-2': 'rgba(255,246,234,.72)',
        'ink-3': 'rgba(230,214,190,.5)',
        accent: '#FFB454',
        'accent-2': '#FF7A59',
        'accent-text': '#FFC278',
        'alert-red': '#FF4D5E',
        line: 'rgba(255,180,84,.15)',
        'status-active': '#35D49A',
        'status-completed': '#5B93FF',
        'status-onhold': '#E8C14A',
        'solar-sun': '#FFC060',
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['"Fira Code"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #FFB454 0%, #FF7A59 100%)',
        'solar-glass-gradient': 'linear-gradient(160deg, rgba(255,180,84,.12), rgba(120,60,20,.08))',
      },
      boxShadow: {
        'solar-glow': '0 calc(8 * var(--u, 1px)) calc(26 * var(--u, 1px)) rgba(255,150,70,.35)',
        'solar-card': '0 calc(24 * var(--u, 1px)) calc(60 * var(--u, 1px)) rgba(0,0,0,.35)',
      },
    },
  },
  plugins: [],
}
