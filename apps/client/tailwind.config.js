/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'huly-bg': '#090A0F',
        'huly-card': '#0B0C0E',
        'huly-text-dim': '#95979E',
        'huly-input-ph': 'rgba(255, 255, 255, 0.2)',
        'huly-divider': '#2D2F31',
        'huly-input-bg': '#1A1D21',
      },
      backgroundImage: {
        // Gradiente do botão extraído do CSS
        'huly-btn': 'linear-gradient(91.7deg, rgba(188, 155, 143, 0.1) 38.66%, rgba(233, 132, 99, 0.1) 68.55%, #E98463 85.01%, #FFFFFF 92.12%)',
        'huly-btn-blur': 'linear-gradient(90.25deg, rgba(255, 177, 153, 0) 6.11%, rgba(255, 177, 153, 0.2) 53.57%, #FF7950 93.6%)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'huly-card': '0px 4px 25px rgba(11, 13, 16, 0.8)',
        'huly-social': '0px 0px 0px 1px rgba(255, 255, 255, 0.1)', // A borda dos botões sociais é uma sombra
      }
    },
  },
  plugins: [],
}