/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', 'class'],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				'50': '#fdffe5',
  				'100': '#fbffc7',
  				'200': '#f8ff95',
  				'300': '#f4ff5a',
  				'400': '#eeff2b',
  				'500': '#e2ff00',
  				'600': '#bce600',
  				'700': '#8eb300',
  				'800': '#6c8706',
  				'900': '#5a710a',
  				'950': '#304000',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			accent: {
  				'500': '#ffffff',
  				'600': '#e5e5e5',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			gray: {
  				'50': '#fafafa',
  				'100': '#f4f4f5',
  				'200': '#e4e4e7',
  				'300': '#d4d4d8',
  				'400': '#a1a1aa',
  				'500': '#71717a',
  				'600': '#52525b',
  				'700': '#3f3f46',
  				'800': '#27272a',
  				'900': '#18181b',
  				'950': '#111111'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
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
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'ui-monospace',
  				'monospace'
  			],
  			display: [
  				'Oswald',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'Playfair Display',
  				'serif'
  			]
  		},
  		animation: {
  			gradient: 'gradient 8s linear infinite',
  			float: 'float 6s ease-in-out infinite',
  			glow: 'glow 2s ease-in-out infinite alternate',
  			'slide-in-up': 'slideInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'slide-in-left': 'slideInLeft 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'slide-in-right': 'slideInRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'fade-in': 'fadeIn 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'scale-in': 'scaleIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  			'bounce-subtle': 'bounceSubtle 2s infinite',
  			noise: 'noise 1s steps(2) infinite'
  		},
  		keyframes: {
  			gradient: {
  				'0%, 100%': {
  					'background-size': '200% 200%',
  					'background-position': 'left center'
  				},
  				'50%': {
  					'background-size': '200% 200%',
  					'background-position': 'right center'
  				}
  			},
  			float: {
  				'0%, 100%': {
  					transform: 'translateY(0px)'
  				},
  				'50%': {
  					transform: 'translateY(-20px)'
  				}
  			},
  			glow: {
  				'0%': {
  					boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
  				},
  				'100%': {
  					boxShadow: '0 0 40px rgba(59, 130, 246, 0.8)'
  				}
  			},
  			slideInUp: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(30px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			slideInLeft: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(-30px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			slideInRight: {
  				'0%': {
  					opacity: '0',
  					transform: 'translateX(30px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateX(0)'
  				}
  			},
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					opacity: '0',
  					transform: 'scale(0.9)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'scale(1)'
  				}
  			},
  			bounceSubtle: {
  				'0%, 100%': {
  					transform: 'translateY(0)',
  					animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)'
  				},
  				'50%': {
  					transform: 'translateY(-5px)',
  					animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)'
  				}
  			},
  			noise: {
  				'0%, 100%': {
  					transform: 'translate(0, 0)'
  				},
  				'10%': {
  					transform: 'translate(-5%, -5%)'
  				},
  				'20%': {
  					transform: 'translate(-10%, 5%)'
  				},
  				'30%': {
  					transform: 'translate(5%, -10%)'
  				},
  				'40%': {
  					transform: 'translate(-5%, 15%)'
  				},
  				'50%': {
  					transform: 'translate(-10%, 5%)'
  				},
  				'60%': {
  					transform: 'translate(15%, 0)'
  				},
  				'70%': {
  					transform: 'translate(0, 15%)'
  				},
  				'80%': {
  					transform: 'translate(3%, 35%)'
  				},
  				'90%': {
  					transform: 'translate(-10%, 10%)'
  				}
  			}
  		},
  		backdropBlur: {
  			xs: '2px'
  		},
  		backgroundImage: {
  			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
  			'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
  			'gradient-mesh': 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
  		},
  		boxShadow: {
  			glow: '0 0 40px rgba(59, 130, 246, 0.3)',
  			'glow-lg': '0 0 60px rgba(59, 130, 246, 0.4)',
  			'inner-glow': 'inset 0 2px 8px rgba(59, 130, 246, 0.1)'
  		},
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  			'128': '32rem'
  		},
  		borderRadius: {
  			'4xl': '2rem',
  			'5xl': '2.5rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontSize: {
  			'2xs': [
  				'0.625rem',
  				{
  					lineHeight: '0.75rem'
  				}
  			],
  			'10xl': [
  				'10rem',
  				{
  					lineHeight: '1'
  				}
  			],
  			'11xl': [
  				'12rem',
  				{
  					lineHeight: '1'
  				}
  			],
  			'12xl': [
  				'14rem',
  				{
  					lineHeight: '1'
  				}
  			]
  		},
  		lineHeight: {
  			'12': '3rem',
  			'extra-loose': '2.5'
  		},
  		transitionDuration: {
  			'400': '400ms',
  			'600': '600ms',
  			'800': '800ms',
  			'900': '900ms'
  		},
  		zIndex: {
  			'60': '60',
  			'70': '70',
  			'80': '80',
  			'90': '90',
  			'100': '100'
  		},
  		opacity: {
  			'15': '0.15',
  			'35': '0.35',
  			'65': '0.65',
  			'85': '0.85'
  		}
  	}
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0,0,0,0.10)',
        },
        '.text-shadow-md': {
          textShadow: '0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)',
        },
        '.text-shadow-lg': {
          textShadow: '0 15px 30px rgba(0,0,0,0.11), 0 5px 15px rgba(0,0,0,0.08)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.transform-style-3d': {
          transformStyle: 'preserve-3d',
        },
        '.backface-hidden': {
          backfaceVisibility: 'hidden',
        },
        '.mask-gradient': {
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    },
      require("tailwindcss-animate")
],
} 