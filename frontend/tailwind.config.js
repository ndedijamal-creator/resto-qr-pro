/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette de marque RESTO QR PRO
        primary: {
          DEFAULT: '#ff2e88',
          50: '#fff0f7',
          100: '#ffdcec',
          200: '#ffb8d9',
          300: '#ff85bd',
          400: '#ff529f',
          500: '#ff2e88',
          600: '#e8106a',
          700: '#c00857',
          800: '#9c0a4a',
          900: '#800c40',
        },
        ink: '#0f0f11',
        surface: '#ffffff',
        muted: '#f5f5f7',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,15,17,0.06), 0 8px 24px -12px rgba(15,15,17,0.12)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
