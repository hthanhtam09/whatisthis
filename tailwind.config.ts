import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			'game-primary': '#FF6F91',
  			'game-secondary': '#FF9671',
  			'game-tertiary': '#FFC75F',
  			'background-light': '#845EC2',
  			'background-purple': '#6A3E9F',
  			'text-light': '#FFFFFF',
  			'text-dark': '#000000',
  			'shape-pink-orange': '#FFB5A7',
  			'shape-pink': '#FFC1CC',
  			'shape-beige': '#F4D1AE',
  			'shape-taupe': '#D4A574',
  			'shape-mauve': '#E8B4B8',
  			'shape-fuchsia': '#FF9FCA',
  			'shape-peach': '#FFD4B3',
  			'shape-lavender': '#E6D3F0',
  			'shape-mint': '#B5E5CF',
  			'shape-coral': '#FFA07A',
  			'shape-yellow': '#FFE5B4',
  			'shape-rose': '#FFB6C1',
  			'shape-sky': '#B0E0E6',
  			'shape-apricot': '#FFCC99',
  		},
  		fontFamily: {
  			display: ['Fredoka One', 'cursive'],
  			body: ['Poppins', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			DEFAULT: '1rem',
  			xl: '3rem',
  			full: '9999px'
  		},
  		keyframes: {
  			float: {
  				'0%': { transform: 'translateY(0px) rotate(0deg)' },
  				'50%': { transform: 'translateY(-20px) rotate(10deg)' },
  				'100%': { transform: 'translateY(0px) rotate(0deg)' },
  			},
  			glow: {
  				'0%, 100%': { 'text-shadow': '0 0 10px #FFC75F, 0 0 20px #FFC75F, 0 0 30px #FFC75F' },
  				'50%': { 'text-shadow': '0 0 20px #FF9671, 0 0 30px #FF9671, 0 0 40px #FF9671' },
  			},
  			bounceGlow: {
  				'0%, 100%': { transform: 'translateY(0)', boxShadow: '0 10px 20px rgba(255, 111, 145, 0.4), 0 0 10px #FF9671' },
  				'50%': { transform: 'translateY(-10px)', boxShadow: '0 20px 40px rgba(255, 111, 145, 0.6), 0 0 20px #FFC75F' },
  			},
  			wiggle: {
  				'0%, 100%': { transform: 'rotate(-3deg) scale(1.1)' },
  				'50%': { transform: 'rotate(3deg) scale(1.1)' },
  			},
  			timerDeplete: {
  				'from': { width: '100%' },
  				'to': { width: '0%' },
  			},
  			confetti: {
  				'0%': { transform: 'translateY(0) rotateZ(0)', opacity: '1' },
  				'100%': { transform: 'translateY(100px) rotateZ(360deg)', opacity: '0' },
  			},
  		},
  		animation: {
  			float: 'float 6s ease-in-out infinite',
  			'float-slow': 'float 8s ease-in-out infinite',
  			'float-fast': 'float 4s ease-in-out infinite',
  			glow: 'glow 2.5s ease-in-out infinite',
  			'bounce-glow': 'bounceGlow 2s ease-in-out infinite',
  			wiggle: 'wiggle 0.5s ease-in-out infinite',
  			timer: 'timerDeplete 30s linear infinite',
  			confetti: 'confetti 1s ease-out forwards',
  		}
  	}
  },
  plugins: [tailwindcssAnimate],
};
export default config;
