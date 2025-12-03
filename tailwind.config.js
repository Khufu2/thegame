export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
      colors: {
        br: {
          bg: '#050505', // Deep Black
          card: '#121212',
          surface: '#1A1A1A',
          border: '#2A2A2A',
          text: '#FFFFFF',
          muted: '#A1A1A1',
          accent: '#00FFB2', // Electric Green
        },
        sheena: {
          primary: '#6366F1', // Indigo
          secondary: '#00FFB2', // Teal
          text: '#E0E7FF'
        }
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      }
    },
  },
}