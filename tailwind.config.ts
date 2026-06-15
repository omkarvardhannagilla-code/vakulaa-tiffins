import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vakulaa Tiffins Brand Colors
        brand: {
          forest:   '#0F4C25',   // Deep forest green – primary
          leaf:     '#1A7A3C',   // Medium green
          lime:     '#8BC34A',   // Staff uniform green
          gold:     '#F2C84B',   // Temple gold – logo accent
          amber:    '#E6A817',   // Deeper gold
          mist:     '#E8F5E6',   // Light green background
          bark:     '#5C3D11',   // Warm brown (wood paneling)
          brick:    '#B5452A',   // Brick red (interior)
          cream:    '#FDFBF5',   // Warm white
          charcoal: '#1A1A1A',   // Body text
        },
      },
      fontFamily: {
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'leaf-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%231A7A3C' fill-opacity='0.05'%3E%3Cpath d='M20 0C20 0 0 10 0 20C0 30 10 40 20 40C30 40 40 30 40 20C40 10 20 0 20 0Z'/%3E%3C/g%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'plate': '0 4px 20px rgba(15, 76, 37, 0.15), 0 1px 4px rgba(15, 76, 37, 0.1)',
        'card':  '0 2px 12px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(15, 76, 37, 0.2)',
      },
      borderRadius: {
        'leaf': '0% 60% 0% 60%',
      },
      animation: {
        'steam': 'steam 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease',
        'bounce-subtle': 'bounceSlight 0.6s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
      },
      keyframes: {
        steam: {
          '0%, 100%': { transform: 'translateY(0) scaleX(1)', opacity: '0.7' },
          '50%': { transform: 'translateY(-8px) scaleX(1.1)', opacity: '0.4' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceSlight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
          '70%': { transform: 'translateY(-4px)' },
        },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(15, 76, 37, 0.4)' },
          '70%': { boxShadow: '0 0 0 10px rgba(15, 76, 37, 0)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
