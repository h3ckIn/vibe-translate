/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: '#1C1C1C',
        paper: '#FBFBF4',
        canvas: '#F4F1E8',
        rule: '#E8E6DE',
        brand: {
          50: '#EDF6F1',
          100: '#D2E8DB',
          400: '#3DA67A',
          500: '#1F7A5A',
          600: '#155C44',
          700: '#0E4533',
        },
        warn: '#E07A3F',
        ok: '#3FB47B',
      },
      boxShadow: {
        soft: '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -12px rgba(28,28,28,0.10)',
        chip: '0 0 0 1px rgba(31,122,90,0.18) inset',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        rise: 'rise 0.42s cubic-bezier(.2,.7,.2,1) both',
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
