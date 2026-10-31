/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: {
          bg: 'var(--bg)',
          bg2: 'var(--bg2)',
          text: 'var(--text)',
          text2: 'var(--text2)',
          border: 'var(--border)',
          btn: 'var(--btn)',
          btnText: 'var(--btn-text)',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}