/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ipl: {
          blue:   '#003F5C',
          gold:   '#F4A700',
          dark:   '#0A0E1A',
          card:   '#111827',
          border: '#1F2937',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
