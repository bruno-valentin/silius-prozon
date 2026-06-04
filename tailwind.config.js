/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        prozon: {
          navy: '#0a1f3c',
          blue: '#1a3a6b',
          orange: '#e8620a',
          'orange-light': '#f07a2a',
          gray: '#f4f6f9',
          'gray-mid': '#8a9ab5',
          border: '#dce3ef',
        },
      },
      fontFamily: {
        sans: ['var(--font-primary)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
