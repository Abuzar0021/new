/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: { berry: { DEFAULT: '#e0263d', deep: '#8a1c2b' }, marble: '#f3efe9' },
      backdropBlur: { '3xl': '64px' },
      keyframes: {
        marquee: { to: { transform: 'translateX(-50%)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
      },
      animation: { marquee: 'marquee 30s linear infinite', pulseDot: 'pulseDot 1.6s ease-in-out infinite' },
    },
  },
  plugins: [],
};
