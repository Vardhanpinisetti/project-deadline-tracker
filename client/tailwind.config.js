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
        'text-main': '#FFF6EA',
        muted: '#B6A78F',
        surface: 'rgba(24, 18, 12, 0.6)',
        'surface-border': 'rgba(255, 180, 84, 0.22)',
        'surface-border-strong': 'rgba(255, 180, 84, 0.45)',
        accent: '#FFB454',
        'accent-2': '#FF7A59',
        'alert-red': '#FF4D5E',
        'status-active': '#35D49A',
        'status-completed': '#5B93FF',
        'status-onhold': '#E8C14A',
        'solar-sun': '#FFC060',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #FFB454 0%, #FF7A59 100%)',
        'red-gradient': 'linear-gradient(135deg, #FF4D5E 0%, #E11D48 100%)',
      },
      boxShadow: {
        'solar-card': '0 14px 40px rgba(0, 0, 0, 0.3)',
        'solar-glow': '0 8px 28px rgba(255, 180, 84, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        btn: '14px',
      },
      animation: {
        'shimmer': 'shimmer 1.8s infinite linear',
        'fade-in': 'fadeIn 180ms ease-out forwards',
        'scale-in': 'scaleIn 180ms ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
